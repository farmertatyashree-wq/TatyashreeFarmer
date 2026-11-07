import { createServerFn } from '@tanstack/react-start';
import { validateFarmingInput } from './ai/schemas';

export const farmingAI = createServerFn({ method: 'POST' })
  .inputValidator(validateFarmingInput)
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { ok: false as const, status: 401, message: 'Gemini AI is not configured.' };
    const { generateFarming } = await import('./ai/farming.server');
    try { return { ok: true as const, result: await generateFarming(data, key) }; }
    catch (error) {
      const { gatewayError } = await import('./ai/access.server');
      return { ok: false as const, ...gatewayError(error) };
    }
  });