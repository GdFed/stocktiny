import { getJSON } from '@/services/http';
import { useFetchWithFallback, type UseFetchOptions, type UseFetchResult } from '@/hooks/use-fetch-with-fallback';
import type { EmotionPhaseData } from '@/types';
import { emotionPhases } from '@/data/strategyData';

/**
 * 获取情绪周期阶段列表（冰点/复苏/发酵/高潮/分歧/退潮）
 * - 实际请求路径：/emotion/phases
 * - 获取失败或数据校验不通过时，回退到本地 emotionPhases
 */
export function useEmotionPhases(
  options?: UseFetchOptions<EmotionPhaseData[]>
): UseFetchResult<EmotionPhaseData[]> {
  const fetcher = async () => {
    // NOTE: 如需调整为真实后端路径，在此修改即可，例如 '/api/emotion/phases'
    return await getJSON<EmotionPhaseData[]>('/emotion/phases');
  };

  const validate = (data: EmotionPhaseData[]) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    // 基本字段校验
    return data.every((p) =>
      typeof p?.id === 'string' &&
      typeof p?.name === 'string' &&
      typeof p?.color === 'string' &&
      typeof p?.bgColor === 'string' &&
      typeof p?.features === 'string' &&
      typeof p?.strategy === 'string' &&
      typeof p?.position === 'string'
    );
  };

  return useFetchWithFallback<EmotionPhaseData[]>(fetcher, emotionPhases, {
    validate,
    ...(options ?? {}),
  });
}
