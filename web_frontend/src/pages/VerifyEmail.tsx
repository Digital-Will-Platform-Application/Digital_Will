import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { backendApi } from "@/lib/backendApi";
import { toast } from "sonner";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const result = await backendApi.verifyEmail(token);
      
      if (result.success) {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
        toast.success("Email verified successfully!");
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(result.message || "Verification failed");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to verify email");
      console.error("Email verification error:", error);
    }
  };

  return (
    <div className="page-ambient min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying Email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription className="mt-2">
            {status === "loading" && "Please wait while we verify your email address"}
            {status === "success" && "Your email address has been successfully verified"}
            {status === "error" && message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <>
              <p className="text-center text-muted-foreground">
                {message}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <p className="text-center text-muted-foreground">
                {message}
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
