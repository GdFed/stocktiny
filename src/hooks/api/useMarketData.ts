import { getJSON } from '@/services/http';
import { useFetchWithFallback, type UseFetchOptions, type UseFetchResult } from '@/hooks/use-fetch-with-fallback';
import type { MarketData } from '@/types';
import { mockMarketData } from '@/data/strategyData';

/**
 * 获取市场概览数据（涨停数、跌停数、炸板率、溢价率、最高板等）
 * - 实际请求路径：/market/summary（可通过 VITE_API_BASE 配置网关前缀）
 * - 获取失败或数据校验不通过时，回退到 mockMarketData
 */
export function useMarketData(
  options?: UseFetchOptions<MarketData>
): UseFetchResult<MarketData> {
  const fetcher = async () => {
    // NOTE: 如需调整为真实后端路径，在此修改即可，例如 '/api/market/summary'
    return await getJSON<MarketData>('/market/summary');
  };

  const validate = (data: MarketData) => {
    return data != null
      && typeof data.limitUpCount === 'number'
      && typeof data.limitDownCount === 'number'
      && typeof data.brokenBoardRate === 'number'
      && typeof data.premiumRate === 'number'
      && typeof data.advanceRate1to2 === 'number'
      && typeof data.advanceRate2to3 === 'number'
      && typeof data.maxHeight === 'number';
  };

  return useFetchWithFallback<MarketData>(fetcher, mockMarketData, {
    validate,
    ...(options ?? {}),
  });
}
