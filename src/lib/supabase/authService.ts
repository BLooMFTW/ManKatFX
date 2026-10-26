import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from './client';

// Initial platform invitation/access gate credential
const INITIAL_ACCESS_CODE = '259300';

export function validateInitialAccessCode(code: string): boolean {
  if (!code) return false;
  return code.trim() === INITIAL_ACCESS_CODE;
}

export async function signUpUser(
  email: string,
  pass: string,
  displayName?: string
): Promise<{ user: User | null; error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  });

  if (error) return { user: null, error: new Error(error.message) };
  return { user: data.user, error: null };
}

export async function signInUser(
  email: string,
  pass: string
): Promise<{ user: User | null; error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) return { user: null, error: new Error(error.message) };
  return { user: data.user, error: null };
}

export const DEMO_USER: User = {
  id: 'demo_user_inst',
  email: 'trader@mankatfx.com',
  app_metadata: { provider: 'email' },
  user_metadata: { display_name: 'Senior Prop Trader' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
};

export function signInDemoUser(): User {
  localStorage.setItem('mankatfx_demo_active', 'true');
  return DEMO_USER;
}

export function isDemoSession(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('mankatfx_demo_active') === 'true';
}

export async function signOutUser(): Promise<void> {
  localStorage.removeItem('mankatfx_demo_active');
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors on sign out
    }
  }
}

export async function resetUserPassword(email: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured yet. Please configure your project credentials.');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw new Error(error.message);
}

export async function updateUserPassword(newPass: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured yet. Please configure your project credentials.');

  const { error } = await supabase.auth.updateUser({ password: newPass });
  if (error) throw new Error(error.message);
}

export async function getInitialSession(): Promise<Session | null> {
  if (isDemoSession()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (isDemoSession()) {
    callback(DEMO_USER);
    return () => {};
  }

  const supabase = getSupabase();
  if (!supabase) {
    callback(null);
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (isDemoSession()) {
      callback(DEMO_USER);
    } else {
      callback(session?.user || null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}
