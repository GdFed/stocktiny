import { getJSON } from '@/services/http';
import { useFetchWithFallback, type UseFetchOptions, type UseFetchResult } from '@/hooks/use-fetch-with-fallback';
import type { ChecklistStep } from '@/types';
import { checklistSteps as mockChecklistSteps } from '@/data/strategyData';

/**
 * 获取复盘 Checklist 步骤数据
 * - 实际请求路径：/checklist/steps
 * - 获取失败或数据校验不通过时，回退到本地 mockChecklistSteps
 */
export function useChecklist(
  options?: UseFetchOptions<ChecklistStep[]>
): UseFetchResult<ChecklistStep[]> {
  const fetcher = async () => {
    // NOTE: 如需调整为真实后端路径，在此修改为真实 API，例如 '/api/checklist/steps'
    return await getJSON<ChecklistStep[]>('/checklist/steps');
  };

  const validate = (data: ChecklistStep[]) => {
    if (!Array.isArray(data)) return false;
    return data.every((step) =>
      typeof step?.id === 'number' &&
      typeof step?.title === 'string' &&
      typeof step?.duration === 'string' &&
      Array.isArray(step?.items) &&
      step.items.every((item) =>
        typeof item?.id === 'string' &&
        typeof item?.title === 'string' &&
        typeof item?.completed === 'boolean'
      )
    );
  };

  return useFetchWithFallback<ChecklistStep[]>(fetcher, mockChecklistSteps as ChecklistStep[], {
    validate,
    ...(options ?? {}),
  });
}
