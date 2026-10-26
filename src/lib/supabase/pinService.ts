import { User } from '@supabase/supabase-js';
import { getSupabase } from './client';

/**
 * Fetch PIN from local storage first (instant), then Supabase profiles table, then auth user metadata.
 */
export async function fetchUserPin(userId: string): Promise<string | null> {
  if (!userId) return null;

  // 1. Check local storage
  const localPin = localStorage.getItem(`mankatfx_pin_${userId}`);
  if (localPin && /^\d{4}$/.test(localPin)) {
    return localPin;
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      // 2. Query Supabase PostgreSQL profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('security_pin')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data?.security_pin && /^\d{4}$/.test(String(data.security_pin))) {
        const pin = String(data.security_pin);
        localStorage.setItem(`mankatfx_pin_${userId}`, pin);
        return pin;
      }

      // 3. Check Supabase auth user metadata
      const { data: userData } = await supabase.auth.getUser();
      const metaPin =
        userData?.user?.user_metadata?.security_pin ||
        userData?.user?.user_metadata?.pin_code;
      if (metaPin && /^\d{4}$/.test(String(metaPin))) {
        const pin = String(metaPin);
        localStorage.setItem(`mankatfx_pin_${userId}`, pin);
        return pin;
      }
    } catch (err) {
      console.warn('Error fetching security PIN from Supabase:', err);
    }
  }

  return null;
}

/**
 * Synchronous check for currently loaded/cached PIN.
 */
export function getUserPin(user: User | null): string | null {
  if (!user) return null;

  // 1. Check local cache
  const localPin = localStorage.getItem(`mankatfx_pin_${user.id}`);
  if (localPin && /^\d{4}$/.test(localPin)) {
    return localPin;
  }

  // 2. Check Supabase user metadata
  const metaPin = user.user_metadata?.security_pin || user.user_metadata?.pin_code;
  if (metaPin && /^\d{4}$/.test(String(metaPin))) {
    localStorage.setItem(`mankatfx_pin_${user.id}`, String(metaPin));
    return String(metaPin);
  }

  return null;
}

/**
 * Save the 4-digit PIN to Supabase database (profiles table) and Supabase Auth metadata, and cache locally.
 */
export async function setUserPin(userId: string, pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN must consist of exactly 4 numeric digits.');
  }

  // 1. Update local cache immediately
  localStorage.setItem(`mankatfx_pin_${userId}`, pin);

  // 2. Persist to Supabase
  const supabase = getSupabase();
  if (supabase) {
    // A. Update PostgreSQL profiles table
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ security_pin: pin, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) {
        console.warn('Notice updating profiles.security_pin:', profileError.message);
        // If profile row didn't exist yet, try upsert
        await supabase.from('profiles').upsert({
          id: userId,
          security_pin: pin,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Failed to persist security_pin to public.profiles:', err);
    }

    // B. Also update Supabase Auth user metadata
    try {
      await supabase.auth.updateUser({
        data: {
          security_pin: pin,
          pin_code: pin,
        },
      });
    } catch (err) {
      console.warn('Could not sync PIN to Supabase user metadata:', err);
    }
  }
}

/**
 * Verify whether the entered PIN matches the user's PIN.
 */
export function verifyUserPin(user: User | null, pin: string): boolean {
  const currentPin = getUserPin(user);
  if (!currentPin) return false;
  return currentPin === pin;
}

/**
 * Clear the user's PIN from Supabase and cache.
 */
export async function clearUserPin(userId: string): Promise<void> {
  localStorage.removeItem(`mankatfx_pin_${userId}`);
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('profiles').update({ security_pin: null }).eq('id', userId);
    } catch (err) {
      console.warn('Could not clear PIN in profiles table:', err);
    }
    try {
      await supabase.auth.updateUser({
        data: {
          security_pin: null,
          pin_code: null,
        },
      });
    } catch (err) {
      console.warn('Could not clear PIN in Supabase user metadata:', err);
    }
  }
}
