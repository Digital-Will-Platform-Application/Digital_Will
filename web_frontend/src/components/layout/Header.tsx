import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Menu, X, LogOut, User, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThreeDLogo from "@/components/branding/ThreeDLogo";
import { cn } from "@/lib/utils";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileIconError, setProfileIconError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading, isAdmin, isSuperAdmin } = useAuth();
  const { t } = useTranslation();

  const navLinks = [
    { href: "/", label: t("header.home") },
    { href: "/about", label: t("header.about") },
    { href: "/learn-more", label: t("header.faq") },
    { href: "/contact", label: t("header.contactUs") },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isHomePage = location.pathname === "/";
  const isLanding = isHomePage;
  const avatarUrl = ((user?.user_metadata?.avatar_url as string | null | undefined) ?? "").trim();
  const showAvatar = Boolean(avatarUrl) && /^https?:\/\//i.test(avatarUrl);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme === "dark" || (!storedTheme && prefersDark);
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
    if (!storedTheme) localStorage.setItem("theme", shouldUseDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("common.signOutSuccess") || "Signed out successfully");
    navigate("/");
  };

  const navLinkLanding = (href: string) =>
    cn(
      "rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-200 lg:px-3",
      isLanding
        ? isActive(href)
          ? "bg-slate-900/[0.06] text-[hsl(var(--navy))] dark:bg-white/10 dark:text-[hsl(var(--primary))]"
          : "text-slate-600 hover:bg-slate-900/[0.06] hover:text-[hsl(var(--navy))] dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-100"
        : isActive(href)
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
    );

  const navLinkPill = (href: string) =>
    cn(
      "rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200",
      isActive(href)
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 border-b backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-xl",
        isLanding &&
          "border-t-[3px] border-t-[hsl(var(--navy))] border-slate-200/90 bg-white/95 supports-[backdrop-filter]:bg-white/90 dark:border-slate-800 dark:border-t-[hsl(var(--primary))] dark:bg-slate-950/98 dark:supports-[backdrop-filter]:bg-slate-950/95",
        !isLanding && "border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/75",
      )}
    >
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grid h-[4.25rem] grid-cols-[1fr_auto] items-center gap-3 md:h-[4.75rem] md:grid-cols-[minmax(0,220px)_1fr_minmax(0,280px)] md:gap-4 lg:gap-6">
          {/* Logo */}
          <div className="flex min-w-0 items-center justify-self-start">
            <Link
              to="/"
              className="group inline-flex max-w-full items-center gap-2.5 rounded-xl py-1 outline-none transition-opacity hover:opacity-90"
            >
              <ThreeDLogo className="h-9 w-9 shrink-0 scale-95 transition-transform group-hover:scale-100 sm:h-10 sm:w-10" />
              <span
                className={cn(
                  "truncate font-serif text-lg font-semibold tracking-tight sm:text-xl",
                  isLanding ? "text-[hsl(var(--navy))] dark:text-slate-100" : "text-foreground",
                )}
              >
                Digital Will
              </span>
            </Link>
          </div>

          {/* Center nav — desktop only; grid column 2 */}
          <nav
            className={cn("hidden min-w-0 justify-center justify-self-center md:flex", !isLanding && "px-1")}
            aria-label="Main navigation"
          >
            {isLanding ? (
              <div className="flex flex-wrap items-center justify-center gap-0.5 lg:gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} to={link.href} className={navLinkLanding(link.href)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-card/70 p-1 shadow-sm backdrop-blur-sm">
                {navLinks.map((link) => (
                  <Link key={link.href} to={link.href} className={navLinkPill(link.href)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 justify-self-end sm:gap-2.5 md:gap-3">
            <div className="hidden items-center gap-2 md:flex lg:gap-2.5">
              {!loading && user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="h-9 gap-1.5 px-2.5 text-xs sm:px-3 sm:text-sm">
                        <Shield className="h-4 w-4 shrink-0" />
                        <span className="hidden lg:inline">
                          {isHomePage ? "Dashboard" : isSuperAdmin ? "Super Admin" : "Admin"}
                        </span>
                        <span className="lg:hidden">Admin</span>
                      </Button>
                    </Link>
                  )}
                  <Link to="/account" title={t("header.profile")} aria-label={t("header.profile")}>
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 overflow-hidden rounded-full p-0">
                      {showAvatar && !profileIconError ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={() => setProfileIconError(true)}
                        />
                      ) : profileIconError ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <img
                          src="/profile-icon.png"
                          alt=""
                          className="h-5 w-5 object-contain brightness-0 dark:invert"
                          onError={() => setProfileIconError(true)}
                        />
                      )}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="h-9 gap-2 px-2 sm:px-3" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span className="hidden xl:inline">{t("header.signOut")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-full"
                    onClick={toggleTheme}
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={cn(
                      "hidden items-center gap-1 text-sm font-semibold transition-colors lg:inline-flex",
                      isLanding
                        ? "text-slate-700 hover:text-[hsl(var(--navy))] dark:text-slate-200 dark:hover:text-[hsl(var(--primary))]"
                        : "text-foreground hover:text-primary",
                    )}
                  >
                    {t("header.login")}
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-full",
                      isLanding && "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                    onClick={toggleTheme}
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                  <Link to="/signup">
                    <Button
                      size="sm"
                      className={cn(
                        "h-9 rounded-full px-4 font-semibold shadow-sm sm:px-5",
                        isLanding
                          ? "bg-[hsl(var(--navy))] text-white hover:bg-[hsl(var(--navy))]/90 dark:bg-[hsl(var(--primary))] dark:text-slate-950 dark:hover:bg-[hsl(var(--primary))]/90"
                          : "bg-primary hover:bg-primary/90",
                      )}
                    >
                      {t("common.getStarted")}
                    </Button>
                  </Link>
                </>
              )}
              <div className="flex items-center [&_button]:min-h-9">
                <LanguageSwitcher />
              </div>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={toggleTheme}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <button
                type="button"
                className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "md:hidden border-b backdrop-blur-md",
              isLanding
                ? "border-slate-200/90 bg-white/98 dark:border-slate-800 dark:bg-slate-950/98"
                : "border-border/60 bg-background/95",
            )}
          >
            <nav
              className="container mx-auto flex max-w-[1400px] flex-col gap-1 px-4 py-4 sm:px-6"
              aria-label="Mobile navigation"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="py-2">
                <LanguageSwitcher showText={true} />
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={toggleTheme}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? "Light mode" : "Dark mode"}
              </Button>
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                {!loading && user ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2">
                          <Shield className="h-4 w-4" />
                          {isHomePage ? "Dashboard" : isSuperAdmin ? "Super Admin" : "Admin"}
                        </Button>
                      </Link>
                    )}
                    <Link
                      to="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      title={t("header.profile")}
                      aria-label={t("header.profile")}
                    >
                      <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 overflow-hidden rounded-full p-0">
                        {showAvatar && !profileIconError ? (
                          <img
                            src={avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={() => setProfileIconError(true)}
                          />
                        ) : profileIconError ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <img
                            src="/profile-icon.png"
                            alt=""
                            className="h-6 w-6 object-contain brightness-0 dark:invert"
                            onError={() => setProfileIconError(true)}
                          />
                        )}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full gap-2"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      {t("header.signOut")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="gold" className="w-full">
                        {t("header.login")}
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="gold" className="w-full">
                        {t("header.signUp")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
