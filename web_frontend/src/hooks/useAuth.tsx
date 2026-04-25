import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { clearLoginActivitySessionFlag, recordLoginActivity, shouldRecordLoginActivityThisTab } from '@/lib/loginActivity';
import { backendApi, RegisterRequest, SessionApiError } from '@/lib/backendApi';
import { toast } from 'sonner';

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
};

type SignInUpOptions = {
  /** If true, persist for 30 days. If false, persist only for this browser session. */
  rememberFor30Days?: boolean;
};

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminLoading: boolean;
  signUp: (payload: RegisterRequest, options?: SignInUpOptions) => Promise<{ error: Error | null; data?: { user: AuthUser } }>;
  signIn: (email: string, password: string, options?: SignInUpOptions) => Promise<{ error: Error | null; data?: { user: AuthUser; session: AuthSession } }>;
  signOut: (options?: { scope?: 'local' | 'global' }) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  updateUserMetadata: (metadata: Record<string, unknown>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'legacywallet_auth';
const SESSION_KEY = 'legacywallet_auth_session';
const EXP_KEY = 'legacywallet_auth_expires_at';

function nowMs() {
  return Date.now();
}

function in30DaysMs() {
  return nowMs() + 30 * 24 * 60 * 60 * 1000;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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
    // Mirrors backend ADMIN_EMAIL so primary admin keeps Super Admin + Settings if API/cache omits flags.
    const primary = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase();
    const emailLower = u.email.trim().toLowerCase();
    const isPrimaryByEnv = Boolean(primary && emailLower === primary);

    const metaAdmin = Boolean((u.user_metadata?.is_admin as boolean | undefined) ?? false);
    const metaSuper = Boolean((u.user_metadata?.is_super_admin as boolean | undefined) ?? false);

    const isAdm = metaAdmin || isPrimaryByEnv;
    const isSuper = metaSuper || isPrimaryByEnv;
    setIsAdmin(isAdm);
    setIsSuperAdmin(isSuper);
    setAdminLoading(false);
  }, []);

  useEffect(() => {
    try {
      const expRaw = localStorage.getItem(EXP_KEY);
      if (expRaw) {
        const exp = Number(expRaw);
        if (Number.isFinite(exp) && exp > 0 && nowMs() > exp) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(EXP_KEY);
        }
      }

      const rawLocal = localStorage.getItem(STORAGE_KEY);
      const rawSession = sessionStorage.getItem(SESSION_KEY);
      const raw = rawLocal || rawSession;
      if (raw) {
        const parsed = JSON.parse(raw) as { user?: AuthUser; session?: AuthSession };
        setUser(parsed.user ?? null);
        setSession(parsed.session ?? null);
        applyAdminFlags(parsed.user ?? null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [applyAdminFlags]);

  // Refresh user role on reload (fixes /admin redirect issues)
  useEffect(() => {
    if (loading) return;
    if (!session?.access_token) return;
    void (async () => {
      try {
        const result = await backendApi.me();
        const u = result.data?.user;
        if (!u?.email || !u?.id) return;
        const nextUser: AuthUser = {
          id: String(u.id),
          email: u.email,
          user_metadata: {
            username: u.username,
            full_name: u.username ?? undefined,
            mobile: u.mobile,
            avatar_url: u.avatar_url ?? null,
            is_admin: u.is_admin ?? false,
            is_super_admin: u.is_super_admin ?? false,
          },
        };
        setUser(nextUser);
        applyAdminFlags(nextUser);
        // Preserve existing persistence mode; default to 30 days if already persisted.
        const wasLocal = Boolean(localStorage.getItem(STORAGE_KEY));
        if (wasLocal) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, session }));
        } else {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: nextUser, session }));
        }
      } catch (e) {
        if (e instanceof SessionApiError && e.status === 401) {
          toast.error(e.message, {
            description: e.hint,
            duration: 14_000,
          });
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(EXP_KEY);
          sessionStorage.removeItem(SESSION_KEY);
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAdminLoading(false);
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
            window.location.replace('/login');
          }
          return;
        }
        // Transient errors: keep cached session
      }
    })();
  }, [loading, session?.access_token, applyAdminFlags]);

  useEffect(() => {
    setAdminLoading(true);
    applyAdminFlags(user);
  }, [user, applyAdminFlags]);

  /** Record browser session for Active sessions (device + UA); once per tab until logout. */
  useEffect(() => {
    if (!user?.id || !session) return;
    if (!shouldRecordLoginActivityThisTab(user.id)) return;
    void recordLoginActivity(user);
  }, [user?.id, session?.access_token]);

  const persistAuth = (nextUser: AuthUser, nextSession: AuthSession, options?: SignInUpOptions) => {
    const remember = options?.rememberFor30Days ?? true;
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, session: nextSession }));
      localStorage.setItem(EXP_KEY, String(in30DaysMs()));
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: nextUser, session: nextSession }));
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXP_KEY);
    }
  };

  const signUp = async (payload: RegisterRequest, options?: SignInUpOptions) => {
    try {
      const result = await backendApi.register(payload);
      if (!result.success || !result.data?.user || !result.data?.token) {
        return { error: new Error(result.message || 'Registration failed'), data: undefined };
      }
      const nextUser: AuthUser = {
        id: String(result.data.user.id),
        email: result.data.user.email,
        user_metadata: {
          username: result.data.user.username,
          full_name: result.data.user.username ?? undefined,
          mobile: result.data.user.mobile,
          avatar_url: result.data.user.avatar_url ?? null,
          is_admin: result.data.user.is_admin ?? false,
          is_super_admin: result.data.user.is_super_admin ?? false,
        },
      };
      const nextSession: AuthSession = { access_token: result.data.token };
      setUser(nextUser);
      setSession(nextSession);
      applyAdminFlags(nextUser);
      persistAuth(nextUser, nextSession, options);
      return { error: null, data: { user: nextUser } };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      return { error: new Error(msg) };
    }
  };

  const signIn = async (email: string, password: string, options?: SignInUpOptions) => {
    try {
      const result = await backendApi.login({ email: email.trim().toLowerCase(), password });
      if (!result.success || !result.data?.user || !result.data?.token) {
        return { error: new Error(result.message || 'Login failed') };
      }
      const nextUser: AuthUser = {
        id: String(result.data.user.id),
        email: result.data.user.email,
        user_metadata: {
          username: result.data.user.username,
          full_name: result.data.user.username ?? undefined,
          mobile: result.data.user.mobile,
          avatar_url: result.data.user.avatar_url ?? null,
          is_admin: result.data.user.is_admin ?? false,
          is_super_admin: result.data.user.is_super_admin ?? false,
        },
      };
      const nextSession: AuthSession = { access_token: result.data.token };
      setUser(nextUser);
      setSession(nextSession);
      applyAdminFlags(nextUser);
      persistAuth(nextUser, nextSession, options);
      return { error: null, data: { user: nextUser, session: nextSession } };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      return { error: new Error(msg) };
    }
  };

  const signOut = async (options?: { scope?: 'local' | 'global' }) => {
    if (user?.id) clearLoginActivitySessionFlag(user.id);
    setUser(null);
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXP_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const resetPassword = async (email: string) => {
    return { error: new Error('Password reset is not configured for backend auth yet.') };
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

  const updateUserMetadata = (metadata: Record<string, unknown>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser: AuthUser = {
        ...prev,
        user_metadata: {
          ...(prev.user_metadata ?? {}),
          ...metadata,
        },
      };
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { user?: AuthUser; session?: AuthSession };
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              ...parsed,
              user: nextUser,
            }),
          );
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, session }));
        }
      } catch {
        // ignore storage sync issues
      }
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isSuperAdmin, adminLoading, signUp, signIn, signOut, resetPassword, updatePassword, updateUserMetadata }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
