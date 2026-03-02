import { getJSON } from '@/services/http';
import { useFetchWithFallback, type UseFetchOptions, type UseFetchResult } from '@/hooks/use-fetch-with-fallback';
import type { RiskRule } from '@/types';
import { riskRules as mockRiskRules } from '@/data/strategyData';

/**
 * 获取风险控制规则
 * - 实际请求路径：/risk/rules
 * - 获取失败或数据校验不通过时，回退到本地 mockRiskRules
 */
export function useRiskRules(
  options?: UseFetchOptions<RiskRule[]>
): UseFetchResult<RiskRule[]> {
  const fetcher = async () => {
    // NOTE: 如需调整为真实后端路径，在此修改为真实 API，例如 '/api/risk/rules'
    return await getJSON<RiskRule[]>('/risk/rules');
  };

  const validate = (data: RiskRule[]) => {
    if (!Array.isArray(data)) return false;
    return data.every((rule) =>
      typeof rule?.id === 'string' &&
      typeof rule?.title === 'string' &&
      typeof rule?.enabled === 'boolean' &&
      typeof rule?.triggered === 'boolean'
    );
  };

  return useFetchWithFallback<RiskRule[]>(fetcher, mockRiskRules as RiskRule[], {
    validate,
    ...(options ?? {}),
  });
}
