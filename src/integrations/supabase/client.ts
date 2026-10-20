import { createClient } from '@supabase/supabase-js';

// Backend not connected yet: placeholder values keep the screens working; data calls fail softly.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

// Loosely typed until the app's data tables are created; then switch back to createClient<Database>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
  },
});
