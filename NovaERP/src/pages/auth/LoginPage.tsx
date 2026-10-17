import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { 
  Mail, 
  Factory, 
  Cpu,
  CheckCircle2,
  Boxes,
  Eye,
  EyeOff,
  Lock,
  Loader2
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getDefaultRouteForUser } from "@/hooks/use-permissions";
import { authApi } from "@/api/auth.api";
import { useFormValidation } from "@/hooks/use-form-validation";
import { ApiError } from "@/lib/api-helper";
import { ValidationSummary } from "@/components/ui/ValidationSummary";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const FeatureItem = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    className="group flex items-start space-x-4 p-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.07] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 hover:from-white/[0.06] hover:to-white/[0.02] hover:border-indigo-400/20 hover:-translate-y-[3px] hover:shadow-[0_20px_40px_rgba(99,102,241,0.08)] cursor-default"
  >
    <div className="flex-shrink-0 p-2.5 bg-gradient-to-br from-indigo-500/15 to-purple-500/10 rounded-xl border border-indigo-400/10 group-hover:from-indigo-500/25 group-hover:to-purple-500/15 group-hover:border-indigo-400/20 transition-all duration-300 shadow-sm shadow-indigo-500/10">
      <Icon className="w-5 h-5 text-indigo-300 group-hover:text-indigo-200 transition-colors duration-300" strokeWidth={1.5} />
    </div>
    <div>
      <h3 className="text-[15px] font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-slate-400 text-[13px] mt-1 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const StatusIndicator = ({ text }: { text: string }) => (
  <div className="flex items-center space-x-2 text-slate-400 text-xs">
    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
    <span>{text}</span>
  </div>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const { globalErrors, withValidation, isSubmitting } = useFormValidation({ form });

  /**
   * Handles the credential (Google ID token) returned by the GoogleLogin component.
   * Sends it to the backend which validates it and returns a NovaERP JWT.
   * The resulting JWT goes through the same login() flow as email/password.
   */
  const handleGoogleSignIn = useCallback(async (credential: string) => {
    setGoogleError(null);
    setIsGoogleLoading(true);
    try {
      const response = await authApi.googleSignIn({ credential });
      localStorage.setItem("accessToken", response.accessToken);

      const user = await authApi.getMe();

      // rememberMe defaults to false for Google sign-in — session-only storage
      login(response.accessToken, user, false);

      const targetRoute = getDefaultRouteForUser(user);
      navigate(targetRoute, { replace: true });
    } catch (err: unknown) {
      localStorage.removeItem("accessToken");
      if (err instanceof ApiError) {
        setGoogleError(err.message);
      } else {
        setGoogleError("Google sign-in failed. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [login, navigate]);

  const onSubmit = withValidation(async (data) => {
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      localStorage.setItem("accessToken", response.accessToken);
      
      const user = await authApi.getMe();

      login(response.accessToken, user, data.rememberMe);

      const targetRoute = getDefaultRouteForUser(user);
      navigate(targetRoute, { replace: true });
    } catch (error: any) {
      localStorage.removeItem("accessToken");
      throw error; // Rethrow to let withValidation handle it
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#060a14] overflow-hidden font-sans antialiased selection:bg-indigo-500/30"
    >
      
      {/* LEFT PANEL - Enterprise Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-16 xl:p-24 bg-[#060a14] relative overflow-hidden">
        
        {/* Premium Ambient Background Effects */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Fine dot grid */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]"></div>
          
          {/* Primary Indigo Orb — top left */}
          <motion.div 
            animate={{ opacity: [0.06, 0.1, 0.06], scale: [1, 1.08, 1] }} 
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-600 blur-[140px]" 
          />
          {/* Secondary Purple Orb — center right */}
          <motion.div 
            animate={{ opacity: [0.04, 0.08, 0.04], scale: [1, 1.12, 1] }} 
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[30%] right-[-15%] w-[45%] h-[45%] rounded-full bg-purple-600 blur-[130px]" 
          />
          {/* Cyan accent Orb — bottom */}
          <motion.div 
            animate={{ opacity: [0.03, 0.06, 0.03], scale: [1, 1.06, 1] }} 
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-cyan-500 blur-[120px]" 
          />
        </div>

        {/* Branding */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-start"
        >
          <div className="flex items-center space-x-3.5 mb-1.5">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 border border-indigo-400/30 shadow-lg shadow-indigo-500/25">
              <Cpu className="w-5.5 h-5.5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">NovaERP</span>
          </div>
          <span className="text-slate-500 text-[10px] font-semibold tracking-[0.2em] uppercase ml-[60px]">
            Consumer Electronics Manufacturing
          </span>
        </motion.div>

        {/* Core Content */}
        <div className="relative z-10 max-w-[500px] mt-16 flex-grow flex flex-col justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[2.75rem] font-bold text-white leading-[1.08] tracking-tight mb-5"
          >
            Unified platform for modern manufacturing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-slate-400 text-[1.05rem] leading-relaxed mb-10 font-normal"
          >
            Streamline procurement, monitor production yields, and control global distribution through a single, secure enterprise interface.
          </motion.p>

          <div className="space-y-3.5">
            <FeatureItem 
              icon={Factory} 
              title="Production Control" 
              description="Monitor real-time assembly line metrics, automated BOM routing, and quality assurance workflows."
              delay={0.3}
            />
            <FeatureItem 
              icon={Boxes} 
              title="Global Inventory" 
              description="Trace components across multi-region facilities with automated procurement triggers."
              delay={0.4}
            />
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 space-y-2.5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-5 rounded-2xl backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
          >
            <h4 className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">System Status</h4>
            <div className="grid grid-cols-2 gap-3">
              <StatusIndicator text="Production Services Online" />
              <StatusIndicator text="Inventory Synced" />
              <StatusIndicator text="AI Assistant Ready" />
              <StatusIndicator text="Secure Connection Established" />
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="relative z-10 flex flex-col text-slate-500 text-[11px] font-medium tracking-wide mt-12 space-y-1"
        >
          <span>&copy; 2026 NovaERP</span>
          <span>Consumer Electronics Manufacturing Platform &bull; Version 1.0</span>
          <span>SOC 2 Type II Certified</span>
        </motion.div>
      </div>

      {/* RIGHT PANEL - Login Interface */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-12 relative bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-[#0a0e1a] dark:via-[#0f1525] dark:to-[#0a0e1a]">
        {/* Subtle decorative orb on right panel */}
        <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] rounded-full bg-indigo-100/40 dark:bg-indigo-600/5 blur-[80px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] bg-white/80 dark:bg-white/[0.04] backdrop-blur-2xl rounded-[24px] p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)] relative z-10 border border-slate-200/60 dark:border-white/[0.06]"
        >
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
                <Cpu className="w-6 h-6" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-[1.75rem] font-bold text-slate-900 dark:text-white tracking-tight">Sign in</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[0.95rem] mt-1.5 font-normal">Enter your credentials to access the platform.</p>
          </div>



          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <ValidationSummary errors={globalErrors} />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-slate-700 font-medium text-sm">Email address</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200" strokeWidth={2} />
                        </div>
                        <Input
                          placeholder="name@company.com"
                          type="email"
                          autoComplete="email"
                          className="pl-10 h-11 rounded-xl bg-white border-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:ring-[3px] focus-visible:ring-indigo-600/10 focus-visible:border-indigo-600 transition-all duration-200 text-sm placeholder:text-slate-400"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs mt-1 font-medium" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-slate-700 font-medium text-sm">Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200" strokeWidth={2} />
                        </div>
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="pl-10 pr-10 h-11 rounded-xl bg-white border-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:ring-[3px] focus-visible:ring-indigo-600/10 focus-visible:border-indigo-600 transition-all duration-200 text-sm font-medium placeholder:text-slate-400 placeholder:font-normal"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" strokeWidth={2} />
                          ) : (
                            <Eye className="h-4 w-4" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs mt-1 font-medium" />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between pt-1">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="rounded-[4px] border-slate-300 text-indigo-600 shadow-sm focus-visible:ring-[3px] focus-visible:ring-indigo-600/10 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-all"
                        />
                      </FormControl>
                      <FormLabel className="text-[13px] font-medium text-slate-600 cursor-pointer select-none">
                        Remember for 30 days
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()} 
                  className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors focus:outline-none focus:underline"
                >
                  Forgot password?
                </a>
              </div>

              <div className="pt-5">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-sm shadow-[0_2px_4px_rgba(79,70,229,0.15),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_4px_12px_rgba(79,70,229,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98] active:shadow-inner transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none relative overflow-hidden"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin opacity-80" />
                      <span>Authenticating</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>

              {/* ── Google Sign-In ─────────────────────────────────────────── */}
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white/70 px-4 text-xs font-medium text-slate-400 tracking-wide uppercase">
                    or
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-center" id="google-signin-button">
                {isGoogleLoading ? (
                  <div className="flex items-center justify-center space-x-2 h-10 text-slate-500 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in with Google…</span>
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      if (credentialResponse.credential) {
                        handleGoogleSignIn(credentialResponse.credential);
                      }
                    }}
                    onError={() => {
                      setGoogleError("Google sign-in was cancelled or failed. Please try again.");
                    }}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="368"
                    useOneTap={false}
                  />
                )}
              </div>

              {/* Google-specific error message */}
              {googleError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3"
                >
                  <p className="text-xs font-medium text-red-600">{googleError}</p>
                </motion.div>
              )}
            </form>
          </Form>
        </motion.div>
      </div>
    </motion.div>
  );
}
