import { getJSON } from '@/services/http';
import { useFetchWithFallback, type UseFetchOptions, type UseFetchResult } from '@/hooks/use-fetch-with-fallback';
import type { FourDimensionAnalysis } from '@/types';
import { mockFourDimensionData } from '@/data/strategyData';

/**
 * 获取“四维选股系统”综合分析数据
 * - 实际请求路径：/four-dimension/summary
 * - 获取失败或数据校验不通过时，回退到 mockFourDimensionData
 */
export function useFourDimensionData(
  options?: UseFetchOptions<FourDimensionAnalysis>
): UseFetchResult<FourDimensionAnalysis> {
  const fetcher = async () => {
    // NOTE: 如需调整为真实后端路径，在此修改即可，例如 '/api/four-dimension/summary'
    return await getJSON<FourDimensionAnalysis>('/four-dimension/summary');
  };

  const validate = (data: FourDimensionAnalysis) => {
    if (!data || typeof data !== 'object') return false;

    const themeOk =
      typeof data.theme?.score === 'number' &&
      typeof data.theme?.mainTheme === 'string' &&
      typeof data.theme?.limitUpCount === 'number' &&
      typeof data.theme?.ladderStructure === 'string' &&
      typeof data.theme?.midCapStarted === 'boolean';

    const characterOk =
      typeof data.character?.score === 'number' &&
      typeof data.character?.yearlyLimitUpCount === 'number' &&
      typeof data.character?.maxConsecutiveBoards === 'number' &&
      typeof data.character?.repairRate === 'number' &&
      typeof data.character?.avgPremium === 'number' &&
      typeof data.character?.marketCap === 'string';

    const technicalOk =
      typeof data.technical?.score === 'number' &&
      typeof data.technical?.sealRatio === 'number' &&
      typeof data.technical?.sealTime === 'string' &&
      typeof data.technical?.turnoverRate === 'number' &&
      typeof data.technical?.pattern === 'string';

    const fundOk =
      typeof data.fund?.score === 'number' &&
      typeof data.fund?.dragonTigerList === 'string' &&
      typeof data.fund?.institutionNetBuy === 'number' &&
      typeof data.fund?.seatQuality === 'string' &&
      typeof data.fund?.relayExpectation === 'string';

    const totalOk = typeof data.totalScore === 'number';

    return themeOk && characterOk && technicalOk && fundOk && totalOk;
  };

  return useFetchWithFallback<FourDimensionAnalysis>(fetcher, mockFourDimensionData, {
    validate,
    ...(options ?? {}),
  });
}
