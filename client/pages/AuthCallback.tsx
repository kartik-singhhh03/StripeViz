import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { DarkLayout } from "@/components/DarkLayout";
import { trackLoginSuccess, trackSignupSuccess } from "@/lib/analytics";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        const errorMessages: Record<string, string> = {
          oauth_denied: "OAuth authentication was denied",
          oauth_failed: "Authentication failed. Please try again",
          missing_code: "Missing authorization code",
          invalid_state: "Invalid security state. Possible CSRF attack",
          email_not_verified: "Your email is not verified with this provider",
          no_email_found: "No email found in your account",
          oauth_init_failed: "Failed to initialize OAuth flow",
        };

        setErrorMessage(errorMessages[error] || "An unknown error occurred");
        setStatus("error");

        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }

      if (!token) {
        setErrorMessage("No authentication token received");
        setStatus("error");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }

      localStorage.setItem("token", token);
      setStatus("success");
      
      // Track OAuth login/signup success (GA4)
      // Determine provider from URL path or use generic 'oauth'
      const provider = searchParams.get("provider") as 'google' | 'github' || 'google';
      const isNewUser = searchParams.get("new_user") === "true";
      
      if (isNewUser) {
        trackSignupSuccess(provider);
      } else {
        trackLoginSuccess(provider);
      }

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <DarkLayout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 w-full max-w-md">
          <div className="flex flex-col items-center text-center space-y-6">
            {status === "loading" && (
              <>
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    Completing Sign In
                  </h2>
                  <p className="text-[var(--text-muted)]">Please wait while we set up your account...</p>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    Success!
                  </h2>
                  <p className="text-[var(--text-muted)]">Redirecting to your dashboard...</p>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    Authentication Failed
                  </h2>
                  <p className="text-[var(--text-muted)]">{errorMessage}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    Redirecting to login...
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DarkLayout>
  );
}
