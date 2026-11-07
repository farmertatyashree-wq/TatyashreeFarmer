import { supabaseAdmin } from '@/integrations/supabase/client.server';

export async function assertAiAccess() {
  const { data, error } = await supabaseAdmin.from('ai_access_state').select('status,message').eq('id', 'gemini').maybeSingle();
  if (error) throw new Error('AI access checks are unavailable. Please try later.');
  if (data) throw Object.assign(new Error(data.message), { status: data.status });
}

export async function rememberAiBlock(status: number, message: string) {
  if (status !== 402 && status !== 403) return;
  const { error } = await supabaseAdmin.from('ai_access_state').upsert({ id: 'gemini', status, message });
  if (error) throw new Error('AI access has been blocked; the access state could not be saved.');
}

export function gatewayError(error: unknown): { status: number; message: string } {
  if (typeof error === 'object' && error !== null) {
    const e = error as { statusCode?: number; status?: number; responseBody?: string; message?: string };
    let message = e.message || 'AI service unavailable.';
    if (e.responseBody) {
      try { const body = JSON.parse(e.responseBody); message = body.message || body.error?.message || message; } catch { /* Keep safe SDK message. */ }
    }
    return { status: e.statusCode || e.status || 500, message };
  }
  return { status: 500, message: 'AI service unavailable.' };
}