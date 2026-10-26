import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

// Active Verified Supabase Credentials
export const ACTIVE_SUPABASE_URL = 'https://proezhmtdadbqjoiriec.supabase.co';
export const ACTIVE_SUPABASE_ANON_KEY = 'sb_publishable_ToPpsC4Yg3IG11YMLgqfGg_4kOXNSsc';

// Auto-cleanse any obsolete tokens in browser localStorage on script load
if (typeof window !== 'undefined') {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes('kqzjuwkfsgrdegbqhpum') ||
          key.includes('enhuelgxgnncufskrmdv') ||
          key === 'mankatfx_supabase_url' ||
          key === 'mankatfx_supabase_anon_key' ||
          key === 'mankatfx_auth_token')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage access safety
  }
}

export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: ACTIVE_SUPABASE_URL,
    anonKey: ACTIVE_SUPABASE_ANON_KEY,
    isConfigured: true,
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(ACTIVE_SUPABASE_URL, ACTIVE_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'mankatfx_auth_token_v2',
      },
    });
  }
  return supabaseInstance;
}
