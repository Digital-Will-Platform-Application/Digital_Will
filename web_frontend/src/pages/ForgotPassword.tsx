import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import ThreeDLogo from "@/components/branding/ThreeDLogo";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background page-ambient lg:flex-row">
      {/* Left Panel — same language as Login (light column + glass card) */}
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

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="heading-section text-foreground mb-2">Check Your Email</h1>
              <p className="text-muted-foreground mb-8">
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your inbox and click the link to reset your password.
              </p>
              <Link to="/login">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <h1 className="heading-section text-foreground mb-2">Forgot Password?</h1>
              <p className="text-muted-foreground mb-8">
                No worries, we'll send you reset instructions.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@email.com"
                      className="input-elevated pl-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  variant="gold"
                  className="w-full"
                  size="lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>

              {/* Back to login */}
              <div className="mt-8 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
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
            Secure Your Legacy Today
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Your account security is our top priority.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
