import { getBrowserUserAgent, getDeviceLabel, getOrCreateDeviceId } from "@/lib/deviceSession";

const SESSION_RECORD_KEY = "dw_login_activity_recorded";

export function clearLoginActivitySessionFlag(userId: string): void {
  try {
    sessionStorage.removeItem(`${SESSION_RECORD_KEY}_${userId}`);
  } catch {
    /* ignore */
  }
}

/**
 * Records a login/session for the current browser (device id + UA).
 * Safe to call once per tab session after sign-in (guarded by sessionStorage).
 */
export async function recordLoginActivity(
  user: { id: string; email?: string | null },
  emailOverride?: string | null,
): Promise<void> {
  // Supabase-backed active session history is optional. In NeonDB mode, Supabase is disabled,
  // so skip recording rather than throwing a user-visible toast.
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  const { supabase } = await import("@/integrations/supabase/client");

  const deviceId = getOrCreateDeviceId();
  const userAgent = getBrowserUserAgent();
  const deviceLabel = getDeviceLabel(userAgent);
  const email = emailOverride ?? user.email ?? null;

  const payload = {
    user_id: user.id,
    email,
    logged_at: new Date().toISOString(),
    device_id: deviceId,
    device_label: deviceLabel,
    user_agent: userAgent,
  };

  const { error } = await supabase.from("login_activity").insert(payload as any);

  if (error) {
    // Columns may not exist until migration is applied — fallback to minimal row
    const { error: fallbackError } = await supabase.from("login_activity").insert({
      user_id: user.id,
      email,
      logged_at: new Date().toISOString(),
    });
    if (fallbackError) {
      console.warn("login_activity insert failed:", fallbackError.message);
    }
  }
}

/** Call once after successful auth in this browser tab (avoids duplicate rows on every re-render). */
export function shouldRecordLoginActivityThisTab(userId: string): boolean {
  try {
    const key = `${SESSION_RECORD_KEY}_${userId}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}
