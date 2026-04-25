import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import { backendApi, RegisterRequest, SessionApiError } from '@/lib/backendApi';
import {
  type AuthUser,
  type AuthSession,
  getPersistedAuth,
  setPersistedAuth,
  clearPersistedAuth,
} from '@/lib/authStorage';
import { clearLoginActivitySessionFlag, recordLoginActivity, shouldRecordLoginActivityThisSession } from '@/lib/loginActivity';

/** Fallback when EXPO_PUBLIC_ADMIN_EMAIL is unset; should match backend ADMIN_EMAIL / web primary admin. */
const SUPER_ADMIN_CREDENTIAL_EMAIL = 'adminlegacywallet@gmail.com';

type AuthContextType = {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminLoading: boolean;
  signUp: (payload: RegisterRequest) => Promise<{ error: Error | null; data?: { user: AuthUser } }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data?: { user: AuthUser; session: AuthSession } }>;
  signInWithOtpPhone: (phone: string) => Promise<{ error: Error | null }>;
  signOut: (options?: { scope?: 'local' | 'global' }) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  updateUser: (data: { full_name?: string; mobile?: string }) => Promise<{ error: Error | null }>;
  updateUserMetadata: (metadata: Record<string, unknown>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAuthUserFromApi(row: {
  id: number;
  username: string;
  email: string;
  mobile?: string;
  avatar_url?: string | null;
  is_admin?: boolean;
  is_super_admin?: boolean;
  created_at?: string;
}): AuthUser {
  return {
    id: String(row.id),
    email: row.email,
    user_metadata: {
      username: row.username,
      full_name: row.username ?? undefined,
      mobile: row.mobile,
      avatar_url: row.avatar_url ?? null,
      is_admin: row.is_admin ?? false,
      is_super_admin: row.is_super_admin ?? false,
      ...(row.created_at ? { created_at: row.created_at } : {}),
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const applyAdminFlags = useCallback((u: AuthUser | null) => {
    if (!u?.email) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setAdminLoading(false);
      return;
    }
    const primary = (process.env.EXPO_PUBLIC_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase();
    const emailLower = u.email.trim().toLowerCase();
    const isPrimaryByEnv = Boolean(primary && emailLower === primary);
    const isCredentialPrimary = emailLower === SUPER_ADMIN_CREDENTIAL_EMAIL;

    const metaAdmin = Boolean((u.user_metadata?.is_admin as boolean | undefined) ?? false);
    const metaSuper = Boolean((u.user_metadata?.is_super_admin as boolean | undefined) ?? false);

    setIsAdmin(metaAdmin || isPrimaryByEnv || isCredentialPrimary);
    setIsSuperAdmin(metaSuper || isPrimaryByEnv || isCredentialPrimary);
    setAdminLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const persisted = await getPersistedAuth();
        if (cancelled) return;
        if (persisted) {
          setUser(persisted.user);
          setSession(persisted.session);
          applyAdminFlags(persisted.user);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyAdminFlags]);

  useEffect(() => {
    if (loading) return;
    if (!session?.access_token) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await backendApi.me();
        const u = result.data?.user;
        if (cancelled || !u?.email || u.id == null) return;
        const persisted = await getPersistedAuth();
        const prevMeta = persisted?.user?.user_metadata ?? {};
        const nextUser: AuthUser = {
          id: String(u.id),
          email: u.email,
          user_metadata: {
            ...prevMeta,
            username: u.username,
            full_name: u.username ?? undefined,
            mobile: u.mobile,
            avatar_url: u.avatar_url ?? null,
            is_admin: u.is_admin ?? false,
            is_super_admin: u.is_super_admin ?? false,
            ...(u.created_at ? { created_at: u.created_at } : {}),
          },
        };
        setUser(nextUser);
        applyAdminFlags(nextUser);
        await setPersistedAuth({ user: nextUser, session });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof SessionApiError && e.status === 401) {
          await clearPersistedAuth();
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, session?.access_token, applyAdminFlags]);

  useEffect(() => {
    setAdminLoading(true);
    applyAdminFlags(user);
  }, [user, applyAdminFlags]);

  useEffect(() => {
    if (!user?.id || !session) return;
    let cancelled = false;
    void (async () => {
      if (!(await shouldRecordLoginActivityThisSession(user.id))) return;
      if (!cancelled) await recordLoginActivity(user);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, session?.access_token]);

  const signUp = async (payload: RegisterRequest) => {
    const emailLower = payload.email.trim().toLowerCase();
    if (emailLower === SUPER_ADMIN_CREDENTIAL_EMAIL) {
      return {
        error: new Error(
          'This email is reserved for administration. You cannot create an account with it.',
        ),
      };
    }
    try {
      const result = await backendApi.register(payload);
      if (!result.success || !result.data?.user || !result.data?.token) {
        return { error: new Error(result.message || 'Registration failed'), data: undefined };
      }
      const nextUser = toAuthUserFromApi(result.data.user);
      const nextSession: AuthSession = { access_token: result.data.token };
      setUser(nextUser);
      setSession(nextSession);
      applyAdminFlags(nextUser);
      await setPersistedAuth({ user: nextUser, session: nextSession });
      return { error: null, data: { user: nextUser } };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      return { error: new Error(msg) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await backendApi.login({ email: email.trim().toLowerCase(), password });
      if (!result.success || !result.data?.user || !result.data?.token) {
        const msg =
          (typeof result.message === 'string' && result.message) ||
          'Login response incomplete. Check that the API URL points to your backend and the server returns { success, data: { user, token } }.';
        return { error: new Error(msg) };
      }
      const nextUser = toAuthUserFromApi(result.data.user);
      const nextSession: AuthSession = { access_token: result.data.token };
      setUser(nextUser);
      setSession(nextSession);
      applyAdminFlags(nextUser);
      await setPersistedAuth({ user: nextUser, session: nextSession });
      return { error: null, data: { user: nextUser, session: nextSession } };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      return { error: new Error(msg) };
    }
  };

  const signInWithOtpPhone = async (_phone: string) => {
    return {
      error: new Error('Phone OTP sign-in is not available. Please use email and password (same account as the web app).'),
    };
  };

  const signOut = async (_options?: { scope?: 'local' | 'global' }) => {
    if (user?.id) void clearLoginActivitySessionFlag(user.id);
    setSession(null);
    setUser(null);
    setLoading(false);
    await clearPersistedAuth();
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setAdminLoading(false);
  };

  const resetPassword = async (_email: string) => {
    return { error: new Error('Password reset is not configured for backend auth yet. Use the web app or contact support.') };
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) {
      return { error: new Error('Please sign in to change your password.') };
    }
    try {
      await backendApi.changePassword({
        user_email: user.email,
        current_password: currentPassword,
        new_password: newPassword,
      });
      return { error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to change password';
      return { error: new Error(msg) };
    }
  };

  const updateUser = async (data: { full_name?: string; mobile?: string }) => {
    if (!user?.email) {
      return { error: new Error('Not signed in') };
    }
    try {
      await backendApi.profileUpdate({
        user_email: user.email,
        ...(data.full_name !== undefined ? { full_name: data.full_name ?? null } : {}),
        ...(data.mobile !== undefined ? { mobile: data.mobile.trim() ? data.mobile.trim() : null } : {}),
      });
      const nextUser: AuthUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...(data.full_name !== undefined
            ? {
                full_name: data.full_name,
                username: data.full_name ?? (user.user_metadata?.username as string | undefined),
              }
            : {}),
          ...(data.mobile !== undefined ? { phone: data.mobile, mobile: data.mobile } : {}),
        },
      };
      setUser(nextUser);
      if (session) await setPersistedAuth({ user: nextUser, session });
      return { error: null };
    } catch (e: unknown) {
      return { error: new Error(e instanceof Error ? e.message : 'Update failed') };
    }
  };

  const updateUserMetadata = (metadata: Record<string, unknown>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser: AuthUser = {
        ...prev,
        user_metadata: { ...(prev.user_metadata ?? {}), ...metadata },
      };
      if (session) void setPersistedAuth({ user: nextUser, session });
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        isSuperAdmin,
        adminLoading,
        signUp,
        signIn,
        signInWithOtpPhone,
        signOut,
        resetPassword,
        updatePassword,
        updateUser,
        updateUserMetadata,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { AuthUser, AuthSession } from '@/lib/authStorage';
