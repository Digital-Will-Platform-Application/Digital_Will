import { useState, useEffect, useCallback, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard,
  Users,
  FileText,
  User,
  LogOut,
  Loader2,
  Filter,
  RefreshCw,
  BarChart3,
  Search,
  ChevronRight,
  Settings,
  Sun,
  Moon,
  Home,
  Info,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { backendApi } from "@/lib/backendApi";
import { handleAdminApiSessionError } from "@/lib/adminSession";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ThreeDLogo from "@/components/branding/ThreeDLogo";

type ReportFilter = "today" | "this_week" | "all_users";

interface LoginActivityRow {
  id: string;
  user_id: string;
  email: string | null;
  logged_at: string;
}

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

const startOfTodayUTC = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const startOfThisWeekUTC = () => {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

interface OverviewStats {
  totalUsers: number;
  usersToday: number;
  totalAssets: number;
  assetsToday: number;
}

const AdminDashboardContent = () => {
  const { user, isAdmin, isSuperAdmin, signOut } = useAuth();
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const fetchOverview = useCallback(async () => {
    if (!user || !isAdmin) {
      setLoadingOverview(false);
      setOverviewStats(null);
      return;
    }
    setLoadingOverview(true);
    try {
      const json = await backendApi.getAdminStats();
      setOverviewStats((json.data as OverviewStats) ?? null);
    } catch (e) {
      setOverviewStats(null);
      if (await handleAdminApiSessionError(e, signOut)) return;
      toast.error(e instanceof Error ? e.message : "Could not load dashboard stats.");
    } finally {
      setLoadingOverview(false);
    }
  }, [user, isAdmin, signOut]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <div className="app-shell max-w-5xl py-6 md:py-8 min-h-full">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Dashboard</span>
      </nav>

      {isSuperAdmin && (
        <Alert className="mb-6 border-primary/25 bg-primary/[0.06]">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Super Admin — sessions and sign-in</AlertTitle>
          <AlertDescription className="text-muted-foreground space-y-1">
            <p>
              Your admin session lasts <span className="font-medium text-foreground">7 days</span>. If you see an error
              about an invalid or expired session, go to <span className="font-medium text-foreground">Login</span> and
              sign in again with the same email and password.
            </p>
            <p>
              You can create secondary admins under <span className="font-medium text-foreground">Admin Settings</span>;
              they use the same login page but cannot open Admin Settings.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of users, logins, and signups.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchOverview();
            }}
            disabled={loadingOverview}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingOverview ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total registered users</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="text-2xl font-semibold">{overviewStats?.totalUsers ?? "—"}</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New users today</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="text-2xl font-semibold">{overviewStats?.usersToday ?? "—"}</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total assets</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="text-2xl font-semibold">{overviewStats?.totalAssets ?? "—"}</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assets added today</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOverview ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="text-2xl font-semibold">{overviewStats?.assetsToday ?? "—"}</span>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SIDEBAR_WIDTH_COLLAPSED = 72;
const SIDEBAR_WIDTH_EXPANDED = 224;

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut, isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || !isAdmin) setLoading(false);
    else setLoading(false);
  }, [user, isAdmin]);
  useEffect(() => () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  useEffect(() => {
    const loadHeaderAvatar = async () => {
      if (!user?.id) return;
      try {
        const raw = (user.user_metadata?.avatar_url as string | null) || null;
        setHeaderAvatarUrl(raw);
      } catch {
        setHeaderAvatarUrl(null);
      }
    };
    void loadHeaderAvatar();
  }, [user?.id, user?.user_metadata]);

  const toggleTheme = () => {
    const nextThemeIsDark = !isDarkMode;
    setIsDarkMode(nextThemeIsDark);
    document.documentElement.classList.toggle("dark", nextThemeIsDark);
    localStorage.setItem("theme", nextThemeIsDark ? "dark" : "light");
  };

  const adminDisplayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "A";

  const handleSidebarEnter = () => {
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
    setSidebarOpen(true);
  };
  const handleSidebarLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setSidebarOpen(false), 200);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out.");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="ui-full-page-loader">
        <div className="ui-loader-ring">
          <span className="ui-loader-ring-border" />
          <span className="ui-loader-ring-core" />
        </div>
      </div>
    );
  }
  if (!user || !isAdmin) {
    navigate("/login", { replace: true });
    return null;
  }

  const isProfilePage = location.pathname === "/admin/account";
  const isUsersPage = location.pathname === "/admin/users";
  const isAnalyticsPage = location.pathname === "/admin/analytics";
  const isSettingsPage = location.pathname === "/admin/settings";
  const isDashboardPage = location.pathname === "/admin" && !isUsersPage && !isAnalyticsPage && !isSettingsPage;
  const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;

  const iconLinkClass = (active: boolean) =>
    cn(
      "flex items-center justify-center w-12 h-12 rounded-xl text-sm font-medium transition-all duration-300",
      active
        ? "app-sidebar-icon-btn shadow-[inset_0_0_0_1px_hsl(var(--app-sidebar-accent)/0.25)] text-[hsl(var(--app-sidebar-accent))]"
        : "text-[hsl(var(--app-sidebar-fg-muted))] hover:text-white hover:bg-white/[0.06] hover:ring-1 hover:ring-white/10",
    );

  return (
    <div className="page-ambient flex h-[100dvh] min-h-0 w-full overflow-hidden bg-background">
      <aside
        className="app-sidebar fixed left-0 top-0 z-40 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden text-slate-100 transition-[width] duration-300 ease-out"
        data-sidebar-width={sidebarWidth}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        {sidebarOpen ? (
          <div className="flex h-full min-h-0 w-56 shrink-0 flex-col">
            <div className="p-4 border-b border-white/[0.06] shrink-0 bg-gradient-to-r from-white/[0.04] to-transparent">
              <Link to="/admin" className="flex items-center gap-3 min-w-0">
                <ThreeDLogo className="scale-95" iconClassName="h-4 w-4" />
                <div className="min-w-0 overflow-hidden">
                  <span className="block truncate font-serif font-semibold tracking-tight text-white">
                    {isSuperAdmin ? "Super Admin" : "Admin"}
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--app-sidebar-fg-muted))]">
                    {isSuperAdmin ? "Super Admin panel" : "Admin panel"}
                  </span>
                </div>
              </Link>
            </div>
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain p-2">
              <Link
                to="/admin"
                className={cn(
                  "group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  isDashboardPage ? "app-sidebar-link-active" : "app-sidebar-link",
                )}
              >
                <LayoutDashboard
                  className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !isDashboardPage && "group-hover:scale-110")}
                />
                <span className="truncate">Dashboard</span>
              </Link>
              <Link
                to="/admin/users"
                className={cn(
                  "group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  isUsersPage ? "app-sidebar-link-active" : "app-sidebar-link",
                )}
              >
                <Users className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !isUsersPage && "group-hover:scale-110")} />
                <span className="truncate">User Management</span>
              </Link>
              <Link
                to="/admin/analytics"
                className={cn(
                  "group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  isAnalyticsPage ? "app-sidebar-link-active" : "app-sidebar-link",
                )}
              >
                <BarChart3
                  className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !isAnalyticsPage && "group-hover:scale-110")}
                />
                <span className="truncate">Analytics & Reports</span>
              </Link>
              <Link
                to="/admin/account"
                className={cn(
                  "group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  isProfilePage ? "app-sidebar-link-active" : "app-sidebar-link",
                )}
              >
                <User className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !isProfilePage && "group-hover:scale-110")} />
                <span className="truncate">Profile</span>
              </Link>
              {isSuperAdmin && (
                <Link
                  to="/admin/settings"
                  className={cn(
                    "group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                    isSettingsPage ? "app-sidebar-link-active" : "app-sidebar-link",
                  )}
                >
                  <Settings
                    className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !isSettingsPage && "group-hover:scale-110")}
                  />
                  <span className="truncate">Admin Settings</span>
                </Link>
              )}
            </nav>
            <div className="shrink-0 border-t border-white/[0.06] bg-gradient-to-t from-black/20 to-transparent p-2">
              {user?.email && (
                <p className="truncate px-3 py-1.5 text-xs font-medium text-[hsl(var(--app-sidebar-fg-muted))]" title={user.email}>
                  {user.email}
                </p>
              )}
              <Button
                variant="destructive"
                className="h-auto min-w-0 w-full justify-start gap-2 rounded-xl border-0 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-950/40 hover:from-red-500 hover:to-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="truncate">Sign out</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 w-full flex-col items-center py-4">
            <ThreeDLogo className="mb-4 scale-90" iconClassName="h-4 w-4" />
            <nav className="flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto overscroll-y-contain px-1">
              <Link to="/admin" title="Dashboard" className={iconLinkClass(isDashboardPage)}>
                <LayoutDashboard className="h-5 w-5" />
              </Link>
              <Link to="/admin/users" title="User Management" className={iconLinkClass(isUsersPage)}>
                <Users className="h-5 w-5" />
              </Link>
              <Link to="/admin/analytics" title="Analytics & Reports" className={iconLinkClass(isAnalyticsPage)}>
                <BarChart3 className="h-5 w-5" />
              </Link>
              <Link to="/admin/account" title="Profile" className={iconLinkClass(isProfilePage)}>
                <User className="h-5 w-5" />
              </Link>
              {isSuperAdmin && (
                <Link to="/admin/settings" title="Admin Settings" className={iconLinkClass(isSettingsPage)}>
                  <Settings className="h-5 w-5" />
                </Link>
              )}
            </nav>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              className="mt-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-950/50 ring-1 ring-red-400/20 transition-all duration-300 hover:from-red-500 hover:to-red-700"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </aside>
      <main
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent transition-[margin] duration-300 ease-out"
        data-sidebar-margin-left={sidebarWidth}
      >
        <div className="sticky top-0 z-20 border-b border-border/60 bg-background/75 shadow-sm shadow-black/[0.03] backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
          <div className="flex items-center justify-end gap-4 px-4 py-3.5 md:px-8">
            <div className="flex shrink-0 items-center gap-2">
              <LanguageSwitcher />
              {isDashboardPage && (
                <Link to="/">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full border-border/70 bg-background/50 shadow-sm transition-all duration-300 hover:border-accent/30 hover:bg-accent/10"
                  >
                    <Home className="h-4 w-4" />
                    {t("userLayout.backToHome")}
                  </Button>
                </Link>
              )}
              <Link
                to="/admin/account"
                className="group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-background/70 shadow-sm transition-all duration-300 hover:border-primary/35 hover:shadow-md"
                title="Profile"
                aria-label="Open admin profile"
              >
                {headerAvatarUrl ? (
                  <img
                    src={headerAvatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={() => setHeaderAvatarUrl(null)}
                  />
                ) : (
                  <span className="text-sm font-semibold text-foreground">
                    {adminDisplayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={toggleTheme}
                className="gap-2 rounded-full border-border/70 bg-background/50 shadow-sm transition-all duration-300 hover:border-accent/30 hover:bg-accent/10"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? "Light" : "Dark"}
              </Button>
            </div>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
export { AdminDashboardContent };
