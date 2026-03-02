import { getJSON } from '@/services/http';
import { useFetchWithFallback, type UseFetchOptions, type UseFetchResult } from '@/hooks/use-fetch-with-fallback';
import type { BuyStrategy, SellStrategy } from '@/types';
import { buyStrategies as mockBuyStrategies, sellStrategies as mockSellStrategies } from '@/data/strategyData';

export interface StrategiesData {
  buy: BuyStrategy[];
  sell: SellStrategy[];
}

/**
 * 获取买/卖策略数据
 * - 实际请求路径：/strategies
 * - 返回格式期望：{ buy: BuyStrategy[], sell: SellStrategy[] }
 * - 获取失败或数据校验不通过时，回退到本地 mock
 */
export function useStrategies(
  options?: UseFetchOptions<StrategiesData>
): UseFetchResult<StrategiesData> {
  const fetcher = async () => {
    // NOTE: 如需调整为真实后端路径，在此修改为真实 API，例如 '/api/strategies'
    return await getJSON<StrategiesData>('/strategies');
  };

  const validate = (data: StrategiesData) => {
    if (!data || typeof data !== 'object') return false;
    const { buy, sell } = data as StrategiesData;
    const buyOk =
      Array.isArray(buy) &&
      buy.every((s) =>
        (s.level === 1 || s.level === 2 || s.level === 3) &&
        typeof s.name === 'string' &&
        typeof s.operation === 'string' &&
        Array.isArray(s.conditions) &&
        s.conditions.every((c) => typeof c === 'string')
      );
    const sellOk =
      Array.isArray(sell) &&
      sell.every((s) =>
        (s.level === 1 || s.level === 2 || s.level === 3) &&
        typeof s.name === 'string' &&
        typeof s.operation === 'string' &&
        Array.isArray(s.conditions) &&
        s.conditions.every((c) => typeof c === 'string')
      );
    return buyOk && sellOk;
  };

  const fallback: StrategiesData = {
    buy: mockBuyStrategies,
    sell: mockSellStrategies,
  };

  return useFetchWithFallback<StrategiesData>(fetcher, fallback, {
    validate,
    ...(options ?? {}),
  });
}
