import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LogOut,
  Loader2,
  User,
  FileText,
  Users,
  UserCircle,
  Sun,
  Moon,
  Home,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import ThreeDLogo from "@/components/branding/ThreeDLogo";

const SIDEBAR_WIDTH_COLLAPSED = 72;
const SIDEBAR_WIDTH_EXPANDED = 224;

const UserLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    // Default to dark mode unless the user explicitly chose light.
    const shouldUseDark = storedTheme ? storedTheme === "dark" : true || prefersDark;
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
    if (!storedTheme) localStorage.setItem("theme", shouldUseDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const avatar = (user?.user_metadata?.avatar_url as string | null | undefined) ?? null;
    setHeaderAvatarUrl(avatar);
  }, [user?.id, user?.user_metadata]);

  const toggleTheme = () => {
    const nextThemeIsDark = !isDarkMode;
    setIsDarkMode(nextThemeIsDark);
    document.documentElement.classList.toggle("dark", nextThemeIsDark);
    localStorage.setItem("theme", nextThemeIsDark ? "dark" : "light");
  };

  const handleSidebarEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setSidebarOpen(true);
  };
  const handleSidebarLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setSidebarOpen(false), 200);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("common.signOutSuccess"));
    navigate("/");
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const isDashboard = location.pathname === "/dashboard";
  const isWillManagement = location.pathname === "/wills";
  const isRecipientManagement = location.pathname === "/recipients";
  const isProfile = location.pathname === "/account";

  if (loading) {
    return (
      <div className="min-h-screen page-ambient bg-background flex items-center justify-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Loader2 className="relative h-7 w-7 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

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
      {/* Sidebar: fixed to viewport — does not scroll with page */}
      <aside
        className="app-sidebar fixed left-0 top-0 z-40 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden text-slate-100 ring-1 ring-white/[0.06] transition-[width] duration-300 ease-out"
        data-sidebar-width={sidebarWidth}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        {sidebarOpen ? (
          <div className="flex h-full min-h-0 w-56 shrink-0 flex-col">
            {/* Top: user name — fixed at top of sidebar */}
            <div className="shrink-0 border-b border-white/[0.07] bg-gradient-to-r from-white/[0.07] via-white/[0.02] to-transparent p-4 backdrop-blur-sm">
              <div className="flex min-w-0 items-center gap-3">
                <ThreeDLogo className="scale-95" iconClassName="h-4 w-4" />
                <div className="min-w-0 overflow-hidden">
                  <span className="block truncate font-serif font-semibold tracking-tight text-white">{displayName}</span>
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--app-sidebar-fg-muted))]">{t("userLayout.myAccountSubtitle")}</span>
                </div>
              </div>
            </div>
            {/* Nav only scrolls if many items; sign-out never scrolls away */}
            <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-y-contain p-2.5">
              <Link to="/dashboard" className={cn("group flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300", isDashboard ? "app-sidebar-link-active" : "app-sidebar-link")}>
                <LayoutDashboard className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !isDashboard && "group-hover:scale-110")} /><span className="truncate">{t("common.dashboard")}</span>
              </Link>
              <Link to="/wills" className={cn("group flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300", isWillManagement ? "app-sidebar-link-active" : "app-sidebar-link")}>
                <FileText className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !isWillManagement && "group-hover:scale-110")} /><span className="truncate">{t("userLayout.navWillManagement")}</span>
              </Link>
              <Link to="/recipients" className={cn("group flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300", isRecipientManagement ? "app-sidebar-link-active" : "app-sidebar-link")}>
                <Users className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !isRecipientManagement && "group-hover:scale-110")} /><span className="truncate">{t("userLayout.navRecipientManagement")}</span>
              </Link>
              <Link to="/account" className={cn("group flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300", isProfile ? "app-sidebar-link-active" : "app-sidebar-link")}>
                <UserCircle className={cn("h-4 w-4 shrink-0 transition-transform duration-300", !isProfile && "group-hover:scale-110")} /><span className="truncate">{t("header.profile")}</span>
              </Link>
            </nav>
            {/* Email + Sign out — always visible at bottom of sidebar */}
            <div className="shrink-0 border-t border-white/[0.08] bg-gradient-to-t from-black/20 to-transparent p-2">
              {user?.email && <p className="truncate px-3 py-1.5 text-xs font-medium text-[hsl(var(--app-sidebar-fg-muted))]" title={user.email}>{user.email}</p>}
              <Button
                variant="destructive"
                className="h-auto min-w-0 w-full justify-start gap-2 rounded-xl border-0 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-950/40 hover:from-red-500 hover:to-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 shrink-0" /><span className="truncate">{t("common.signOut")}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 w-full flex-col items-center py-4">
            <ThreeDLogo className="mb-4 scale-90" iconClassName="h-4 w-4" />
            <nav className="flex min-h-0 w-full flex-1 flex-col items-center gap-1 overflow-y-auto overscroll-y-contain px-1">
              <Link to="/dashboard" title={t("common.dashboard")} className={iconLinkClass(isDashboard)}><LayoutDashboard className="h-5 w-5" /></Link>
              <Link to="/wills" title={t("userLayout.navWillManagement")} className={iconLinkClass(isWillManagement)}><FileText className="h-5 w-5" /></Link>
              <Link to="/recipients" title={t("userLayout.navRecipientManagement")} className={iconLinkClass(isRecipientManagement)}><Users className="h-5 w-5" /></Link>
              <Link to="/account" title={t("header.profile")} className={iconLinkClass(isProfile)}><UserCircle className="h-5 w-5" /></Link>
            </nav>
            <button
              type="button"
              onClick={handleSignOut}
              title={t("common.signOut")}
              className="mt-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-950/50 ring-1 ring-red-400/20 transition-all duration-300 hover:from-red-500 hover:to-red-700"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Main: only this column scrolls; sidebar stays fixed */}
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ease-out"
        data-sidebar-margin-left={sidebarWidth}
      >
        <header className="sticky top-0 z-20 shrink-0 border-b border-border/50 bg-gradient-to-r from-background/90 via-background/80 to-muted/20 shadow-sm shadow-black/[0.04] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <div className="flex items-center justify-end px-4 py-3.5 md:px-8">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {isDashboard && (
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
                to="/account"
                className="group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-background/70 shadow-sm transition-all duration-300 hover:border-primary/35 hover:shadow-md"
                title={t("header.profile")}
                aria-label={t("userLayout.openProfileAria")}
              >
                {headerAvatarUrl ? (
                  <img
                    src={headerAvatarUrl}
                    alt={t("userLayout.profileImageAlt")}
                    className="h-full w-full object-cover"
                    onError={() => setHeaderAvatarUrl(null)}
                  />
                ) : (
                  <span className="text-sm font-semibold text-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="gap-2 rounded-full border-border/70 bg-background/50 shadow-sm transition-all duration-300 hover:border-accent/30 hover:bg-accent/10"
                aria-label={t("userLayout.toggleThemeAria")}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? t("userLayout.themeLight") : t("userLayout.themeDark")}
              </Button>
            </div>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
