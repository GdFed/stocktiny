import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseFetchOptions<T> {
  immediate?: boolean; // auto fetch on mount
  deps?: unknown[]; // dependency array to re-run
  validate?: (data: T) => boolean; // if returns false, fallback will be used
}

export interface UseFetchResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  isFallback: boolean;
  refetch: () => Promise<void>;
}

/**
 * Generic async fetch hook with fallback support.
 * - On error or validation failure, returns fallback data with isFallback=true
 * - Provides refetch() for manual re-execution
 */
export function useFetchWithFallback<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  options?: UseFetchOptions<T>
): UseFetchResult<T> {
  const { immediate = true, deps = [], validate } = options ?? {};
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(immediate));
  const [isError, setIsError] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(false);

  const run = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setIsFallback(false);

    try {
      // Allow external cancellation by replacing controller if needed
      // Note: fetcher should internally respect AbortController if applicable
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const result = await fetcher();

      if (validate && !validate(result)) {
        // validation failure -> use fallback
        setData(fallback);
        setIsFallback(true);
        setIsError(false);
      } else {
        setData(result);
      }
    } catch (_err) {
      // network or server error -> use fallback
      setData(fallback);
      setIsFallback(true);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, fallback, validate]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      void run();
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(async () => {
    await run();
  }, [run]);

  return { data, isLoading, isError, isFallback, refetch };
}
