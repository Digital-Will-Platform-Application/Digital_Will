import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Loader2,
  Info,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { useAuth, type AuthUser } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MIN_LENGTHS } from "@/lib/validation";
import { SUPER_ADMIN_CREDENTIAL_EMAIL } from "@/constants/admin";

function reservedPrimaryAdminEmail(): string {
  const fromEnv = String(import.meta.env.VITE_ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (fromEnv) return fromEnv;
  return SUPER_ADMIN_CREDENTIAL_EMAIL.trim().toLowerCase();
}
import { validatePasswordSecurity } from "@/lib/passwordSecurity";
import CookieConsent from "@/components/CookieConsent";
import { getCountryOptions } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { PhoneCountrySelect } from "@/components/PhoneCountrySelect";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ThreeDLogo from "@/components/branding/ThreeDLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { BrandLogoStrip, FloatingLegacyCards, LoginHeroVisual } from "@/components/branding/BrandIllustrations";
import { LOGIN_HERO_PANEL_GRADIENTS, LOGIN_HERO_VARIANT_COUNT } from "@/constants/loginHero";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, loading: authLoading, adminLoading, isAdmin } = useAuth();
  const { t } = useTranslation();
  const isSignupPage = location.pathname === "/signup";

  const [isLogin, setIsLogin] = useState(!isSignupPage);
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [loginMethod, setLoginMethod] = useState<"email">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [rememberFor30Days, setRememberFor30Days] = useState(true);
  // Step 2 signup fields
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [gender, setGender] = useState("");
  const countryOptions = getCountryOptions();
  const [selectedCountry, setSelectedCountry] = useState("IN");

  /** New random hero on each visit (mount) — copy + art stay on-theme. */
  const [heroVariant] = useState(() => Math.floor(Math.random() * LOGIN_HERO_VARIANT_COUNT));
  const heroT = (suffix: string) => t(`login.heroRotate.${heroVariant}.${suffix}`);

  const buildPhoneNumber = () => {
    const selected = countryOptions.find((country) => country.code === selectedCountry);
    const digits = mobile.replace(/\D/g, "");
    if (!selected || !digits) return "";
    return `${selected.dialCode}${digits}`;
  };

  // Calculate password strength
  const calculatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= MIN_LENGTHS.PASSWORD) strength += 20;
    if (/[A-Z]/.test(pass)) strength += 20;
    if (/[a-z]/.test(pass)) strength += 20;
    if (/[0-9]/.test(pass)) strength += 20;
        // eslint-disable-next-line no-useless-escape -- [ and ] are literal in regex character class
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) strength += 20;
    return strength;
  };


  // Update password strength on password change
  useEffect(() => {
    if (!isLogin) {
      setPasswordStrength(calculatePasswordStrength(password));
    }
  }, [password, isLogin]);

  // Sync signup mode when navigating between /login and /signup
  useEffect(() => {
    setIsLogin(location.pathname !== "/signup");
    setSignupStep(1);
    setLoginMethod("email");
    setOtpSent(false);
  }, [location.pathname]);

  // Redirect if already logged in: wait for admin role check so admin credentials → admin panel, not user panel
  useEffect(() => {
    if (user && !authLoading && !adminLoading) {
      navigate(isAdmin ? "/admin" : "/dashboard");
    }
  }, [user, authLoading, adminLoading, isAdmin, navigate]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("OTP login is disabled. Please use email + password.");
  };

  const handleNext = () => {
    if (!fullName?.trim()) {
      toast.error(t("login.enterFullName"));
      return;
    }
    if (!email?.trim()) {
      toast.error(t("login.fillAllFields"));
      return;
    }
    if (!password) {
      toast.error(t("login.fillAllFields"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("resetPassword.passwordsDoNotMatch") || "Passwords do not match");
      return;
    }
    if (passwordStrength < 100) {
      toast.error(t("login.passwordRequirements") || "Please meet all password requirements");
      return;
    }
    const em = email.trim().toLowerCase();
    if (em === reservedPrimaryAdminEmail()) {
      toast.error("This email is reserved for administration. You cannot create an account with it.");
      return;
    }
    setSignupStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t("login.fillAllFields"));
      return;
    }

    if (isLogin) {
      // Login flow continues below
    } else {
      // Signup step 2 (Register)
      if (!fullName?.trim()) {
        toast.error(t("login.enterFullName"));
        return;
      }
      if (password !== confirmPassword) {
        toast.error(t("resetPassword.passwordsDoNotMatch") || "Passwords do not match");
        return;
      }
    }

    // Block signup for admin email – reserved for administration only
    const emLow = email.trim().toLowerCase();
    if (!isLogin && emLow === reservedPrimaryAdminEmail()) {
      toast.error("This email is reserved for administration. You cannot create an account with it.");
      return;
    }

    setLoading(true);

    // Validate password requirements (only for signup)
    if (!isLogin) {
      // Check password security including leaked password check
      const passwordValidation = await validatePasswordSecurity(password, {
        checkLeaked: true,
        minLength: MIN_LENGTHS.PASSWORD,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true,
      });

      if (!passwordValidation.isValid) {
        setLoading(false);
        
        // Use specific messages for leaked passwords
        if (passwordValidation.isLeaked) {
          if (passwordValidation.leakCount && passwordValidation.leakCount > 1000) {
            toast.error(
              "Password Security Alert",
              {
                description: "This password has been compromised in data breaches. Please choose a unique password.",
                duration: 5000,
              }
            );
          } else {
            toast.error(
              "Password Security Alert", 
              {
                description: "This password has been found in a data breach. Please use a different password.",
                duration: 5000,
              }
            );
          }
        } else {
          // Show a friendly error for other validation issues
          const errorMessage = passwordValidation.errors[0];
          toast.error("Password Requirements Not Met", {
            description: errorMessage,
            duration: 4000,
          });
        }
        
        return;
      }
    }

    try {
      if (isLogin) {
        const { data, error } = await signIn(email, password, { rememberFor30Days });
        if (error) {
          // Normalize and show user-friendly messages for auth errors
          const msg = error.message || '';
          if (msg.includes('Invalid login credentials')) {
            toast.error(t("login.invalidCredentials"));
          } else if (msg.toLowerCase().includes('email not confirmed')) {
            toast.error('Please confirm your email using the link we sent you.');
          } else {
            toast.error(error.message);
          }
        } else {
          // Valid credentials – redirect by EMAIL only (password is never checked for admin vs user).
          // Same password on user and admin accounts is fine; Supabase validates each email+password pair.
          toast.success(t("login.welcomeBackToast"));
          // Redirect: backend indicates is_admin → /admin
          const isAdminUser = Boolean((data?.user as AuthUser | undefined)?.user_metadata?.is_admin);
          navigate(isAdminUser ? "/admin" : "/dashboard");
        }
      } else {
        const phone = mobile.trim() ? buildPhoneNumber() : undefined;
        const { error, data: signupData } = await signUp({
          username: fullName.trim(),
          email: email.trim().toLowerCase(),
          mobile: phone,
          password,
          confirm_password: confirmPassword,
          address1: address1 || undefined,
          address2: address2 || undefined,
          age: age ? Number(age) : undefined,
          state: state || undefined,
          postal_code: postalCode || undefined,
          gender: gender || undefined,
        }, { rememberFor30Days });
        
        // Always check for error first - if error exists, show error and return early
        if (error) {
          // Check for various error messages that indicate email already exists
          const errorMsg = (error.message || String(error) || '').toLowerCase();
          if (errorMsg.includes("already registered") || 
              errorMsg.includes("already exists") || 
              errorMsg.includes("user already registered") ||
              errorMsg.includes("email already") ||
              errorMsg.includes("duplicate") ||
              errorMsg.includes("unique constraint")) {
            toast.error(t("login.emailExists"));
            setLoading(false);
            return;
          } else {
            toast.error(error.message || String(error) || t("login.unexpectedError"));
            setLoading(false);
            return;
          }
        }
        
        toast.success(t("login.accountCreated"));
        const isAdminUser = Boolean(signupData?.user.user_metadata?.is_admin);
        navigate(isAdminUser ? "/admin" : "/onboarding");
      }
    } catch (err) {
      toast.error(t("login.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && adminLoading)) {
    return (
      <div className="min-h-screen page-ambient flex items-center justify-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
          <Loader2 className="relative h-7 w-7 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background page-ambient lg:flex-row">
      {/* Left: original light / mesh background — form only */}
      <div className="relative z-10 flex flex-1 flex-col justify-center border-border/0 bg-background p-5 sm:p-8 lg:min-h-0 lg:w-1/2 lg:max-w-[min(100%,720px)]">
        <div className="absolute right-3 top-3 z-30 sm:right-5 sm:top-5">
          <LanguageSwitcher />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-gold/10 blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Mobile / tablet brand strip */}
        <div className="relative z-10 mb-6 flex items-center gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-soft backdrop-blur-md lg:hidden">
          <ThreeDLogo className="scale-90 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("login.heroBrandLine")}</p>
            <p className="truncate font-serif text-lg font-semibold text-foreground">{heroT("mobileTeaser")}</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mx-auto w-full max-w-[440px]"
        >
          <div className="login-glass-panel relative overflow-hidden rounded-[2rem]">
            <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-gradient-to-b from-primary via-accent to-primary/80" aria-hidden />
            <div className="p-6 sm:p-8 lg:p-9 pl-7 sm:pl-9 lg:pl-10">
          {/* Logo */}
          <Link to="/" className="group mb-6 flex items-center gap-3 transition-transform duration-300 hover:translate-x-0.5">
            <ThreeDLogo className="scale-95 transition-transform duration-300 group-hover:scale-100" />
            <span className="font-serif text-xl font-semibold text-foreground tracking-tight">
              {t("login.appBrandName")}
            </span>
          </Link>

          {/* Signup step indicator */}
          {!isLogin && (
            <div className="mb-6 flex items-center gap-2" aria-hidden>
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${signupStep >= 1 ? "bg-primary" : "bg-muted"}`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${signupStep >= 2 ? "bg-primary" : "bg-muted"}`}
              />
            </div>
          )}

          {/* Header */}
          <div className="mb-7">
            <h1 className="heading-section text-foreground mb-2 text-balance">
              {isLogin ? t("login.welcomeBack") : signupStep === 1 ? t("login.createAccount") : t("login.step2Title")}
            </h1>
            <p className="text-pretty text-base text-muted-foreground">
              {isLogin
                ? t("login.signInToManage")
                : signupStep === 1
                ? t("login.startSecuring")
                : t("login.step2Subtitle")}
            </p>
          </div>

          {/* Login method toggle - only for Sign In */}
            {isLogin && (
              <div className="flex gap-1.5 p-1.5 rounded-2xl bg-muted/60 ring-1 ring-border/50 mb-6 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => { setLoginMethod("email"); setOtpSent(false); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    loginMethod === "email" ? "bg-background text-foreground shadow-md shadow-black/5 ring-1 ring-border/40" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("login.loginWithEmail")}
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMethod("otp"); setOtpSent(false); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    loginMethod === "otp" ? "bg-background text-foreground shadow-md shadow-black/5 ring-1 ring-border/40" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("login.loginWithOtp")}
                </button>
              </div>
            )}

            {isLogin && loginMethod === "otp" ? (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("login.mobileNumber")}
                  </label>
                  {(() => {
                    const dial = countryOptions.find((c) => c.code === selectedCountry)?.dialCode ?? "";
                    return (
                      <div className="flex overflow-hidden rounded-xl border border-input/90 bg-background/80 shadow-sm transition-[border-color,box-shadow] duration-200 focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/40">
                        <PhoneCountrySelect
                          options={countryOptions}
                          value={selectedCountry}
                          onValueChange={setSelectedCountry}
                          disabled={loading || otpSent}
                          triggerClassName="h-12 w-14 min-w-14 justify-center px-2 rounded-none border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0"
                        />
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold tabular-nums text-foreground/90">
                            {dial}
                          </span>
                          <input
                            type="tel"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            placeholder="Number"
                            className="h-12 w-full bg-transparent pl-16 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                            disabled={loading || otpSent}
                            autoComplete="tel"
                          />
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-xs text-muted-foreground mt-1">{t("login.enterPhone")}</p>
                </div>
                {otpSent ? (
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-lg">
                    {t("login.otpSentMessage")}
                  </p>
                ) : (
                  <Button type="submit" variant="gold" className="w-full gap-2" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {t("login.sendOtp")}
                  </Button>
                )}
              </form>
            ) : !isLogin && signupStep === 2 ? (
          /* Signup Step 2: Address, Age, State, Postal code, Gender, Register */
          <form onSubmit={handleSubmit} className="space-y-5">
            <button
              type="button"
              onClick={() => setSignupStep(1)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 -mt-2 mb-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back
            </button>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("login.address1")}</label>
              <input
                type="text"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="Street, building"
                className="input-elevated w-full"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("login.address2")}</label>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="Area, landmark (optional)"
                className="input-elevated w-full"
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("login.age")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="25"
                  className="input-elevated w-full"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("login.gender")}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  title={t("login.gender") || "Gender"}
                  className="input-elevated w-full bg-background"
                  disabled={loading}
                >
                  <option value="">Select</option>
                  <option value="male">{t("login.genderMale")}</option>
                  <option value="female">{t("login.genderFemale")}</option>
                  <option value="other">{t("login.genderOther")}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("login.state")}</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State / Province"
                className="input-elevated w-full"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("login.postalCode")}</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Postal code"
                className="input-elevated w-full"
                disabled={loading}
              />
            </div>
            <Button variant="gold" className="w-full gap-2 mt-6" size="lg" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  {t("login.register")}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
            ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && signupStep === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("login.username")}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter Your Name"
                      className="input-elevated pl-12 transition-all w-full"
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("login.emailId")}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter Your Email"
                      className="input-elevated pl-12 transition-all w-full"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("login.mobileOptional")}</label>
                  {(() => {
                    const dial = countryOptions.find((c) => c.code === selectedCountry)?.dialCode ?? "";
                    return (
                      <div className="flex overflow-hidden rounded-xl border border-input/90 bg-background/80 shadow-sm transition-[border-color,box-shadow] duration-200 focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/40">
                        <PhoneCountrySelect
                          options={countryOptions}
                          value={selectedCountry}
                          onValueChange={setSelectedCountry}
                          disabled={loading}
                          triggerClassName="h-12 w-14 min-w-14 justify-center px-2 rounded-none border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0"
                        />
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold tabular-nums text-foreground/90">
                            {dial}
                          </span>
                          <input
                            type="tel"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            placeholder="Number"
                            className="h-12 w-full bg-transparent pl-16 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                            disabled={loading}
                            autoComplete="tel"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">{t("login.password")}</label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            title="Show password requirements"
                            aria-label="Show password requirements"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPasswordHint(!showPasswordHint)}
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs font-medium mb-2">Password Requirements:</p>
                          <ul className="space-y-1 text-xs">
                            <li>• At least 8 characters</li>
                            <li>• One uppercase & lowercase letter</li>
                            <li>• One number & special character</li>
                            <li>• Not found in data breaches</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="input-elevated pl-12 pr-12 w-full"
                      disabled={loading}
                      onFocus={() => setShowPasswordHint(true)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <progress
                          className="flex-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary accent-primary"
                          value={passwordStrength}
                          max={100}
                          aria-label="Password strength"
                        />
                        <span className="text-xs font-medium text-muted-foreground min-w-[60px]">{passwordStrength <= 40 ? "Weak" : passwordStrength <= 60 ? "Fair" : passwordStrength <= 80 ? "Good" : "Strong"}</span>
                      </div>
                      {showPasswordHint && passwordStrength < 100 && (
                        <div className="mt-2 p-2 bg-secondary/30 rounded-md border border-border/50">
                          <p className="text-xs text-muted-foreground flex items-start gap-2">
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{passwordStrength < 40 ? "Add uppercase, lowercase, numbers, and special characters." : passwordStrength < 60 ? "Good start! Add more variety." : passwordStrength < 80 ? "Almost there!" : "Great password!"}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("login.confirmPassword")}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="input-elevated pl-12 w-full"
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button type="button" variant="gold" className="w-full gap-2 mt-6" size="lg" onClick={handleNext} disabled={loading || passwordStrength < 100 || password !== confirmPassword}>
                  {t("login.next")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
                {passwordStrength < 100 && password.length > 0 && (
                  <p className="text-xs text-center text-muted-foreground">Complete all password requirements to continue</p>
                )}
              </>
            )}

            {isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("login.emailAddress")}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@email.com" className="input-elevated pl-12 transition-all w-full" disabled={loading} autoComplete="email" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">{t("login.password")}</label>
                    <Link to="/forgot-password" className="text-sm text-gold hover:underline font-medium">{t("login.forgotPassword")}</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input-elevated pl-12 pr-12 w-full" disabled={loading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberFor30Days}
                      onChange={(e) => setRememberFor30Days(e.target.checked)}
                      className="rounded border-border cursor-pointer"
                    />
                    <span className="text-muted-foreground select-none">
                      Remember me for 30 days
                    </span>
                  </label>
                </div>
                <Button variant="gold" className="w-full gap-2 mt-6" size="lg" type="submit" disabled={loading}>
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Signing in...</span></> : <>{t("login.signIn")}<ArrowRight className="w-5 h-5" /></>}
                </Button>
              </>
            )}
          </form>
            )}

          {/* Toggle */}
          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="rounded-full bg-card/90 px-3 text-muted-foreground backdrop-blur-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                const newIsLogin = !isLogin;
                setIsLogin(newIsLogin);
                setPassword("");
                setPasswordStrength(0);
                setShowPasswordHint(false);
                navigate(newIsLogin ? "/login" : "/signup");
              }}
              className="mt-4 text-sm font-semibold text-gold transition-colors hover:text-gold-light disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              {isLogin ? "Create Account" : "Sign In"}
            </button>
          </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right: original branded colour — navy / primary (rotating variant) */}
      <div
        className={cn(
          "relative z-10 hidden min-h-0 flex-1 flex-col justify-center overflow-hidden lg:flex",
          "bg-gradient-to-br",
          LOGIN_HERO_PANEL_GRADIENTS[heroVariant] ?? LOGIN_HERO_PANEL_GRADIENTS[0],
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,hsl(var(--accent)/0.12),transparent_55%)]" aria-hidden />
        <div className="absolute right-0 top-1/4 h-[28rem] w-[28rem] rounded-full bg-accent/18 blur-3xl animate-glow-pulse" aria-hidden />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-cream/5 blur-3xl" aria-hidden />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-45 mix-blend-soft-light",
            heroVariant % 2 === 0 ? "bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.12),transparent_50%)]" : "bg-[radial-gradient(circle_at_20%_60%,rgba(255,255,255,0.1),transparent_45%)]",
          )}
          aria-hidden
        />

        <motion.div
          key={heroVariant}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex h-full min-h-[520px] flex-col justify-center px-10 py-14 xl:px-14"
        >
          <div className="mb-8 flex items-center gap-3 text-primary-foreground">
            <ThreeDLogo className="scale-100" iconClassName="h-5 w-5" glowClassName="from-accent/35 to-primary/35 blur-2xl" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">{heroT("eyebrow")}</p>
              <p className="font-serif text-xl font-semibold">{t("login.heroSuiteName")}</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <LoginHeroVisual variant={heroVariant} className="shadow-[0_40px_80px_-30px_rgba(15,23,42,0.55)]" />
            <FloatingLegacyCards variantIndex={heroVariant} className="absolute inset-0" />
          </div>

          <div className="mt-10 max-w-lg space-y-4 text-primary-foreground">
            <h2 className="font-serif text-3xl font-semibold leading-tight text-balance">{heroT("title")}</h2>
            <p className="text-lg text-primary-foreground/80 text-pretty">{heroT("subtitle")}</p>
            <ul className="grid gap-2 text-sm text-primary-foreground/85 sm:grid-cols-2">
              <li className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                {heroT("b1")}
              </li>
              <li className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                {heroT("b2")}
              </li>
            </ul>
            <BrandLogoStrip className="justify-start opacity-90" />
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {!isLogin
              ? [1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      signupStep === i ? "w-6 bg-accent" : "w-2 bg-accent/35"
                    }`}
                  />
                ))
              : [1, 2, 3].map((i) => (
                  <div key={i} className="h-2 w-2 rounded-full bg-accent/55" />
                ))}
          </div>
        </motion.div>
      </div>

      <CookieConsent />
    </div>
  );
};

export default Login;
