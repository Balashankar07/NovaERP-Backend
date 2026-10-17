import { useState } from "react";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { CheckCircle2, Link2, AlertCircle, Loader2 } from "lucide-react";
import { authApi } from "@/api/auth.api";
import { ApiError } from "@/lib/api-helper";

/**
 * ConnectedAccountsTab — Profile page tab for Google account linking.
 *
 * PURPOSE:
 * This is the ONE-TIME account linking flow required because the Google email
 * (e.g. balashankar07@gmail.com) differs from the NovaERP email (admin@novaerp.com).
 *
 * FLOW:
 * 1. User is authenticated via email/password (existing NovaERP JWT in storage).
 * 2. User clicks "Connect Google Account" → Google popup appears.
 * 3. Google verifies identity and returns a signed ID token (credential).
 * 4. POST /api/Auth/link-google is called with the credential.
 * 5. Backend validates the token and stores the Google sub on the user record.
 * 6. From this point, "Continue with Google" on the login page works.
 *
 * SECURITY:
 * - Requires existing NovaERP JWT ([Authorize] on backend endpoint).
 * - Backend validates the Google ID token cryptographically.
 * - One Google account → one NovaERP account (enforced by unique DB constraint).
 */
export function ConnectedAccountsTab() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [linkedEmail, setLinkedEmail] = useState<string>("");

  const handleGoogleLink = async (credential: string) => {
    setStatus("loading");
    setMessage("");
    try {
      const response = await authApi.linkGoogle({ credential });
      setLinkedEmail(response.googleEmail ?? "");
      setStatus("success");
      setMessage(
        `Google account${response.googleEmail ? ` (${response.googleEmail})` : ""} linked successfully. You can now sign in with "Continue with Google".`
      );
    } catch (err: unknown) {
      setStatus("error");
      if (err instanceof ApiError) {
        setMessage(err.message);
      } else {
        setMessage("Failed to link Google account. Please try again.");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Link2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Connected Accounts
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Link external accounts to enable Google sign-in for your NovaERP account.
            </p>
          </div>
        </div>
      </div>

      {/* Google Account Section */}
      <div className="px-8 py-8">
        <div className="flex items-start justify-between gap-6 p-6 rounded-xl border border-slate-200 bg-slate-50/50">
          {/* Google Icon + Info */}
          <div className="flex items-center gap-4">
            {/* Google Logo SVG */}
            <div className="flex-shrink-0 w-11 h-11 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Google</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign in to NovaERP using your Google account
              </p>
              {status === "success" && linkedEmail && (
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Linked as {linkedEmail}
                </p>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="flex-shrink-0">
            {status === "loading" ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-2 px-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Linking…</span>
              </div>
            ) : status === "success" ? (
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium py-2 px-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connected</span>
              </div>
            ) : (
              <div id="profile-google-link-button">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      handleGoogleLink(credentialResponse.credential);
                    }
                  }}
                  onError={() => {
                    setStatus("error");
                    setMessage("Google sign-in was cancelled or failed. Please try again.");
                  }}
                  theme="outline"
                  size="medium"
                  text="signin_with"
                  shape="rectangular"
                  useOneTap={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Status Message */}
        {(status === "success" || status === "error") && message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 ${
              status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-100 bg-red-50 text-red-700"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message}</p>
          </motion.div>
        )}

        {/* Informational Note */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50/60 border border-blue-100">
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">How account linking works:</span> After connecting your 
            Google account, you can use the "Continue with Google" button on the login page to 
            sign in without entering your password. Your NovaERP roles and permissions remain 
            completely unchanged — Google is only an alternative authentication method.
          </p>
        </div>
      </div>
    </div>
  );
}
