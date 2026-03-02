import { getJSON } from '@/services/http';
import { useFetchWithFallback, type UseFetchOptions, type UseFetchResult } from '@/hooks/use-fetch-with-fallback';
import type { LadderLevel } from '@/types';
import { mockLadderData } from '@/data/strategyData';

/**
 * 获取连板天梯数据
 * - 实际请求路径：/ladder/levels
 * - 获取失败或数据校验不通过时，回退到 mockLadderData
 */
export function useLadderData(
  options?: UseFetchOptions<LadderLevel[]>
): UseFetchResult<LadderLevel[]> {
  const fetcher = async () => {
    // NOTE: 如需调整为真实后端路径，在此修改为真实 API，例如 '/api/ladder/levels'
    return await getJSON<LadderLevel[]>('/ladder/levels');
  };

  const validate = (data: LadderLevel[]) => {
    if (!Array.isArray(data)) return false;
    return data.every((lvl) =>
      typeof lvl?.level === 'number' &&
      Array.isArray(lvl?.stocks) &&
      lvl.stocks.every((s) =>
        typeof s?.code === 'string' &&
        typeof s?.name === 'string' &&
        typeof s?.boards === 'number' &&
        typeof s?.theme === 'string' &&
        typeof s?.change === 'number' &&
        typeof s?.volume === 'number'
      )
    );
  };

  return useFetchWithFallback<LadderLevel[]>(fetcher, mockLadderData as LadderLevel[], {
    validate,
    ...(options ?? {}),
  });
}
