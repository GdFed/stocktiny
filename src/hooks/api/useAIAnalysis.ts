import { getJSON } from '@/services/http';
import { useFetchWithFallback, type UseFetchOptions, type UseFetchResult } from '@/hooks/use-fetch-with-fallback';
import type { AIAnalysis } from '@/types';
import { mockAIAnalysis } from '@/data/strategyData';

/**
 * 获取 AI 智能分析结果
 * - 实际请求路径：/ai/analysis
 * - 获取失败或数据校验不通过时，回退到 mockAIAnalysis
 */
export function useAIAnalysis(
  options?: UseFetchOptions<AIAnalysis>
): UseFetchResult<AIAnalysis> {
  const fetcher = async () => {
    // NOTE: 如需调整为真实后端路径，在此修改为真实 API，例如 '/api/ai/analysis'
    return await getJSON<AIAnalysis>('/ai/analysis');
  };

  const validate = (data: AIAnalysis) => {
    if (!data || typeof data !== 'object') return false;

    const statusOk = data.status === 'analyzing' || data.status === 'completed' || data.status === 'error';
    const emotionOk = typeof data.emotionPhase === 'string' && typeof data.emotionDay === 'number';
    const themesOk = Array.isArray(data.recommendedThemes) && data.recommendedThemes.every((t) => typeof t === 'string');
    const targetOk =
      typeof data.targetStock?.name === 'string' &&
      typeof data.targetStock?.code === 'string' &&
      typeof data.targetStock?.boards === 'number' &&
      typeof data.targetStock?.type === 'string';
    const suggestionOk = typeof data.suggestion === 'string';
    const confOk = typeof data.confidence === 'number';

    return statusOk && emotionOk && themesOk && targetOk && suggestionOk && confOk;
  };

  return useFetchWithFallback<AIAnalysis>(fetcher, mockAIAnalysis, {
    validate,
    ...(options ?? {}),
  });
}
