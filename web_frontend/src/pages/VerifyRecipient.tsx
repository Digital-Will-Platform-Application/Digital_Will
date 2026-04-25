import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Mail,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const VerifyRecipient = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid" | "expired" | "rate_limited">("loading");
  const [recipientName, setRecipientName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  useEffect(() => {
    const verifyRecipient = async () => {
      const token = searchParams.get("token");
      const id = searchParams.get("id");

      if (!token || !id) {
        setStatus("invalid");
        return;
      }

      try {
        // Call the database function to verify the recipient
        const { data, error } = await supabase.rpc("verify_recipient", {
          recipient_id_param: id,
          verification_code_param: token,
        });

        if (error) {
          console.error("Error verifying recipient:", error);
          setStatus("error");
          setErrorMessage(error.message || t("verifyRecipient.verificationFailed"));
          return;
        }

        if (!data || !data.success) {
          // Handle specific error codes
          const errorCode = data?.error_code;
          const errorMsg = data?.error || t("verifyRecipient.verificationFailed");
          
          if (errorCode === "CODE_EXPIRED") {
            setStatus("expired");
            setErrorMessage(t("verifyRecipient.codeExpired") || "Verification code has expired");
          } else if (errorCode === "RATE_LIMIT_EXCEEDED") {
            setStatus("rate_limited");
            setErrorMessage(t("verifyRecipient.rateLimitExceeded") || "Too many verification attempts. Please try again later.");
            setRetryAfter(data.retry_after || null);
          } else if (errorCode === "INVALID_CODE") {
            setStatus("error");
            const attemptsRemaining = data?.attempts_remaining;
            if (attemptsRemaining !== undefined) {
              setErrorMessage(
                t("verifyRecipient.invalidCodeWithAttempts", { count: attemptsRemaining }) || 
                `Invalid verification code. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`
              );
            } else {
              setErrorMessage(errorMsg);
            }
          } else {
            setStatus("error");
            setErrorMessage(errorMsg);
          }
          return;
        }

        // Set recipient name if available
        if (data.recipient_name) {
          setRecipientName(data.recipient_name);
        }

        setStatus("success");
        toast.success(t("verifyRecipient.verificationSuccessful"));
      } catch (error) {
        console.error("Error in verification:", error);
        setStatus("error");
        setErrorMessage(t("verifyRecipient.verificationFailed"));
      }
    };

    verifyRecipient();
  }, [searchParams, t]);

  return (
    <div className="min-h-screen page-ambient bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card-elevated text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="heading-section text-foreground mb-4">
                {t("verifyRecipient.verifying")}
              </h1>
              <p className="text-muted-foreground">
                {t("verifyRecipient.pleaseWait")}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sage flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-foreground" />
              </div>
              <h1 className="heading-section text-foreground mb-4">
                {t("verifyRecipient.verificationSuccessful")}
              </h1>
              <p className="text-muted-foreground mb-2">
                {t("verifyRecipient.hello")} {recipientName},
              </p>
              <p className="text-muted-foreground mb-6">
                {t("verifyRecipient.identityVerified")}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Shield className="w-4 h-4" />
                <span>{t("verifyRecipient.secureAndEncrypted")}</span>
              </div>
              <Button
                variant="gold"
                className="gap-2"
                onClick={() => navigate("/")}
              >
                {t("verifyRecipient.continueToHome")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="heading-section text-foreground mb-4">
                {t("verifyRecipient.verificationFailed")}
              </h1>
              <p className="text-muted-foreground mb-6">
                {errorMessage || t("verifyRecipient.invalidOrExpired")}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                {t("verifyRecipient.returnToHome")}
              </Button>
            </>
          )}

          {status === "expired" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="heading-section text-foreground mb-4">
                {t("verifyRecipient.codeExpired") || "Verification Code Expired"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {errorMessage || t("verifyRecipient.codeExpiredMessage") || "This verification link has expired. Please request a new verification email."}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                {t("verifyRecipient.returnToHome")}
              </Button>
            </>
          )}

          {status === "rate_limited" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="heading-section text-foreground mb-4">
                {t("verifyRecipient.tooManyAttempts") || "Too Many Attempts"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {errorMessage}
                {retryAfter && retryAfter > 0 && (
                  <span className="block mt-2 text-sm">
                    {t("verifyRecipient.retryAfter", { seconds: Math.ceil(retryAfter) }) || 
                     `Please try again in ${Math.ceil(retryAfter)} seconds.`}
                  </span>
                )}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                {t("verifyRecipient.returnToHome")}
              </Button>
            </>
          )}

          {status === "invalid" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="heading-section text-foreground mb-4">
                {t("verifyRecipient.invalidLink")}
              </h1>
              <p className="text-muted-foreground mb-6">
                {t("verifyRecipient.missingParameters")}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                {t("verifyRecipient.returnToHome")}
              </Button>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("verifyRecipient.needHelp")}{" "}
            <a href="mailto:support@digitalwill.com" className="text-gold hover:underline">
              {t("verifyRecipient.contactSupport")}
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyRecipient;
