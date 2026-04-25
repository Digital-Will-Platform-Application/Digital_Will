import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { MIN_LENGTHS } from "@/lib/validation";
import { validatePasswordSecurity } from "@/lib/passwordSecurity";
import { useTranslation } from "react-i18next";
import ThreeDLogo from "@/components/branding/ThreeDLogo";

const passwordSchema = z.string().min(MIN_LENGTHS.PASSWORD, { message: `Password must be at least ${MIN_LENGTHS.PASSWORD} characters` });

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("resetPassword.passwordsDoNotMatch") || "Passwords do not match");
      return;
    }

    if (!currentPassword.trim()) {
      toast.error(t("resetPassword.enterCurrent") || "Enter your current password.");
      return;
    }

    setLoading(true);

    try {
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
        // Show first error (most important)
        const errorMessage = passwordValidation.errors[0];
        
        // Use specific translation keys for leaked passwords
        if (passwordValidation.isLeaked) {
          if (passwordValidation.leakCount && passwordValidation.leakCount > 1000) {
            toast.error(t("resetPassword.passwordLeakedMultiple") || errorMessage);
          } else {
            toast.error(t("resetPassword.passwordLeaked") || errorMessage);
          }
        } else {
          // Map common errors to translation keys or show generic error
          if (errorMessage.includes("at least 8 characters")) {
            toast.error(t("login.passwordMinLength") || errorMessage);
          } else if (errorMessage.includes("uppercase")) {
            toast.error(t("login.passwordRuleUppercase") || errorMessage);
          } else if (errorMessage.includes("lowercase")) {
            toast.error(t("login.passwordRuleLowercase") || errorMessage);
          } else if (errorMessage.includes("number")) {
            toast.error(t("login.passwordRuleNumber") || errorMessage);
          } else if (errorMessage.includes("special")) {
            toast.error(t("login.passwordRuleSpecial") || errorMessage);
          } else {
            toast.error(errorMessage);
          }
        }
        
        setLoading(false);
        return;
      }

      const { error } = await updatePassword(currentPassword, password);
      if (error) {
        toast.error(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err) {
      toast.error(t("resetPassword.unexpectedError") || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background page-ambient lg:flex-row">
      {/* Left Panel — aligned with Login / Forgot */}
      <div className="relative flex flex-1 flex-col justify-center bg-background p-5 sm:p-8 lg:w-1/2 lg:max-w-[min(100%,720px)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-gold/10 blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto w-full max-w-md"
        >
          <div className="login-glass-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          {/* Logo */}
          <Link to="/" className="group mb-8 flex items-center gap-3 transition-transform duration-300 hover:translate-x-0.5">
            <ThreeDLogo className="scale-95 transition-transform duration-300 group-hover:scale-100" />
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Digital Will
            </span>
          </Link>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="heading-section text-foreground mb-2">Password Updated!</h1>
              <p className="text-muted-foreground mb-4">
                Your password has been successfully reset. Redirecting you to your dashboard...
              </p>
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" />
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <h1 className="heading-section text-foreground mb-2">Set New Password</h1>
              <p className="text-muted-foreground mb-8">
                Your new password must be at least 8 characters long.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-elevated pl-12 pr-4"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-elevated pl-12 pr-12"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-elevated pl-12 pr-12"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  variant="gold"
                  className="w-full gap-2"
                  size="lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Image/Branding */}
      <div className="relative hidden min-h-0 flex-1 flex-col justify-center overflow-hidden bg-primary lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-primary to-navy-light" />
        <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 flex max-w-md flex-col items-center p-12 text-center text-primary-foreground"
        >
          <div className="mb-8 flex justify-center">
            <ThreeDLogo className="scale-110" iconClassName="h-8 w-8" glowClassName="from-accent/40 to-primary/40 blur-2xl" />
          </div>
          <h2 className="font-serif text-3xl font-semibold mb-4">
            Almost There!
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Create a strong password to keep your legacy secure.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
