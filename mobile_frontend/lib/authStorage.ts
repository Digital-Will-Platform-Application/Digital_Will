import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same storage key as web (`legacywallet_auth`) so behavior matches. */
export const STORAGE_KEY = 'legacywallet_auth';

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
};

export type PersistedAuth = { user: AuthUser; session: AuthSession };

export async function getPersistedAuth(): Promise<PersistedAuth | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedAuth>;
    if (!parsed?.session?.access_token || !parsed?.user?.email) return null;
    return { user: parsed.user as AuthUser, session: parsed.session as AuthSession };
  } catch {
    return null;
  }
}

export async function setPersistedAuth(data: PersistedAuth): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function clearPersistedAuth(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function getStoredAccessToken(): Promise<string | null> {
  const p = await getPersistedAuth();
  return p?.session?.access_token ?? null;
}
