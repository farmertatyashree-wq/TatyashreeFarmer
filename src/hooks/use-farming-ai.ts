import { useServerFn } from '@tanstack/react-start';
import { farmingAI } from '@/lib/farming.functions';
import type { FarmingInput } from '@/lib/ai/schemas';

export function useFarmingAI() {
  const call = useServerFn(farmingAI);
  return async <T,>(task: FarmingInput['task'], payload: Record<string, unknown>, language: FarmingInput['language']): Promise<T> => {
    const response = await call({ data: { task, payload, language } });
    if (!response.ok) throw new Error(response.message);
    return response.result as T;
  };
}