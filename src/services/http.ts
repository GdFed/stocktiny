/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lightweight HTTP client for the app.
 * - Base URL from VITE_API_BASE
 * - Request timeout via AbortController (default VITE_API_TIMEOUT or 8000ms)
 * - JSON helpers with proper error propagation
 */

export class ApiError extends Error {
  status: number;
  url: string;
  body?: unknown;

  constructor(message: string, status: number, url: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

const BASE_URL: string = (import.meta as any).env?.VITE_API_BASE ?? '';
const DEFAULT_TIMEOUT = Number((import.meta as any).env?.VITE_API_TIMEOUT ?? 8000);

type HttpInit = Omit<RequestInit, 'body'> & {
  timeoutMs?: number;
  baseUrl?: string;
  body?: unknown;
};

function buildUrl(path: string, baseUrl?: string) {
  const base = typeof baseUrl === 'string' ? baseUrl : BASE_URL;
  if (!base) return path; // allow absolute/relative path usage without base
  // avoid double slash
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function mergeHeaders(a?: HeadersInit, b?: HeadersInit): HeadersInit {
  const map = new Headers(a ?? {});
  const bMap = new Headers(b ?? {});
  bMap.forEach((v, k) => map.set(k, v));
  return map;
}

function isFormData(val: unknown): val is FormData {
  return typeof FormData !== 'undefined' && val instanceof FormData;
}

function isURLSearchParams(val: unknown): val is URLSearchParams {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

function isBlob(val: unknown): val is Blob {
  return typeof Blob !== 'undefined' && val instanceof Blob;
}

function isArrayBuffer(val: unknown): val is ArrayBuffer {
  return typeof ArrayBuffer !== 'undefined' && val instanceof ArrayBuffer;
}

function isArrayBufferView(val: unknown): val is ArrayBufferView {
  return typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' && ArrayBuffer.isView(val as any);
}

function isReadableStream(val: unknown): val is ReadableStream<any> {
  return typeof ReadableStream !== 'undefined' && val instanceof ReadableStream;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, controller: AbortController): Promise<T> {
  let timer: number | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs) as unknown as number;
    });
    // race fetch and timeout
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function fetchJSON<T>(path: string, init?: HttpInit): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    baseUrl,
    headers,
    body,
    ...rest
  } = init ?? {};

  const url = buildUrl(path, baseUrl);

  const controller = new AbortController();
  const shouldJsonStringify =
    body !== undefined && body !== null && typeof body === 'object' &&
    !isFormData(body) &&
    !isURLSearchParams(body) &&
    !isBlob(body) &&
    !isArrayBuffer(body) &&
    !isArrayBufferView(body) &&
    !isReadableStream(body);
  const finalInit: RequestInit = {
    ...rest,
    headers: mergeHeaders(
      {
        Accept: 'application/json',
        // Only set Content-Type if body should be JSON
        ...(shouldJsonStringify ? { 'Content-Type': 'application/json' } : {}),
      },
      headers
    ),
    body: shouldJsonStringify
        ? JSON.stringify(body as any)
        : (body as any),
    signal: controller.signal,
  };

  try {
    const doFetch = fetch(url, finalInit);
    const res = await withTimeout(doFetch, timeoutMs, controller);

    if (!res.ok) {
      let errBody: unknown = undefined;
      const contentType = res.headers.get('content-type') || '';
      try {
        if (contentType.includes('application/json')) {
          errBody = await res.json();
        } else {
          errBody = await res.text();
        }
      } catch {
        // ignore parse error
      }
      throw new ApiError(`Request failed with status ${res.status}`, res.status, url, errBody);
    }

    // parse JSON (204 no content should return undefined as any)
    if (res.status === 204) return undefined as unknown as T;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // still try to parse as text then JSON
      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new ApiError('Unexpected non-JSON response', res.status, url, text);
      }
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError(`Request aborted (timeout ${timeoutMs}ms)`, 0, url);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message ?? 'Network error', 0, url);
  }
}

/**
 * Convenience helpers
 */
export function getJSON<T>(path: string, init?: Omit<HttpInit, 'method' | 'body'>) {
  return fetchJSON<T>(path, { ...init, method: 'GET' });
}

export function postJSON<T>(path: string, body?: unknown, init?: Omit<HttpInit, 'method' | 'body'>) {
  return fetchJSON<T>(path, { ...init, method: 'POST', body });
}

export function putJSON<T>(path: string, body?: unknown, init?: Omit<HttpInit, 'method' | 'body'>) {
  return fetchJSON<T>(path, { ...init, method: 'PUT', body });
}

export function deleteJSON<T>(path: string, init?: Omit<HttpInit, 'method' | 'body'>) {
  return fetchJSON<T>(path, { ...init, method: 'DELETE' });
}
