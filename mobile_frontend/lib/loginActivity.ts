import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/lib/authStorage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getOrCreateDeviceIdAsync, getNativeDeviceLabel, getNativeUserAgentSnapshot } from '@/lib/deviceSession';

const SESSION_RECORD_KEY = 'dw_login_activity_recorded';

export async function clearLoginActivitySessionFlag(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${SESSION_RECORD_KEY}_${userId}`);
  } catch {
    /* ignore */
  }
}

/** Once per app session after sign-in — mirrors web sessionStorage guard. */
export async function shouldRecordLoginActivityThisSession(userId: string): Promise<boolean> {
  try {
    const key = `${SESSION_RECORD_KEY}_${userId}`;
    const v = await AsyncStorage.getItem(key);
    if (v) return false;
    await AsyncStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

export async function recordLoginActivity(user: AuthUser, emailOverride?: string | null): Promise<void> {
  if (!isSupabaseConfigured) return;

  const deviceId = await getOrCreateDeviceIdAsync();
  const userAgent = getNativeUserAgentSnapshot();
  const deviceLabel = getNativeDeviceLabel();
  const email = emailOverride ?? user.email ?? null;

  const fullPayload = {
    user_id: user.id,
    email,
    logged_at: new Date().toISOString(),
    device_id: deviceId,
    device_label: deviceLabel,
    user_agent: userAgent,
  };

  const { error } = await supabase.from('login_activity').insert(fullPayload as Record<string, unknown>);
  if (error && error.message?.toLowerCase().includes('column')) {
    await supabase.from('login_activity').insert({
      user_id: user.id,
      email,
      logged_at: new Date().toISOString(),
    });
  } else if (error) {
    console.warn('login_activity insert failed:', error.message);
  }
}
