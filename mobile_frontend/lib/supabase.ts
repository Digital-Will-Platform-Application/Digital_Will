import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const extra = (Constants.expoConfig as { extra?: { supabaseUrl?: string; supabaseAnonKey?: string } })?.extra;
const supabaseUrlResolved =
  (process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl ?? '').trim() || '';
const supabaseAnonKeyResolved =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra?.supabaseAnonKey ?? '').trim() || '';

/** False when Supabase env was not set at build time — avoids crashing createClient('',''). */
export const isSupabaseConfigured = Boolean(supabaseUrlResolved && supabaseAnonKeyResolved);

// Dummy host when optional features are unused (login_activity). Real requests no-op / fail gracefully.
const supabaseUrl = supabaseUrlResolved || 'http://127.0.0.1:9';
const supabaseAnonKey = supabaseAnonKeyResolved || 'unconfigured-anon-key';

// On native (Expo Go / device) use AsyncStorage only. On web use localStorage.
// Avoid window.localStorage on device — it can be undefined and breaks auth (e.g. getItem of undefined).
const hasLocalStorage =
  typeof window !== 'undefined' &&
  typeof (window as unknown as { localStorage?: Storage }).localStorage !== 'undefined';

const ls = hasLocalStorage ? (window as unknown as { localStorage: Storage }).localStorage : null;

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (ls) return ls.getItem(key);
    try {
      if (AsyncStorage?.getItem) return (await AsyncStorage.getItem(key)) ?? null;
    } catch {
      // ignore
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (ls) {
      ls.setItem(key, value);
      return;
    }
    try {
      if (AsyncStorage?.setItem) await AsyncStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (ls) {
      ls.removeItem(key);
      return;
    }
    try {
      if (AsyncStorage?.removeItem) await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined',
  },
});
