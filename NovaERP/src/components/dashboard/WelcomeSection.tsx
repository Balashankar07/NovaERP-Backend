import { useAuth } from "@/hooks/use-auth";
import { Cpu, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function WelcomeSection() {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  const getDisplayName = (email?: string) => {
    if (!email) return "System Administrator";
    const namePart = email.split("@")[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateString = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Operational Command Center</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight">
          Welcome back, <span className="gradient-text">{getDisplayName(user?.email)}</span>
        </h1>
        <p className="text-muted-foreground text-xs font-medium max-w-xl">
          Real-time enterprise metrics, production schedules, inventory movements, and quality control telemetry.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-card/80 backdrop-blur-md text-card-foreground border border-border/60 rounded-xl p-3.5 shadow-xs shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-400/30">
            <Cpu className="h-5.5 w-5.5" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground leading-none">{timeString}</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase bg-muted/60 px-1.5 py-0.5 rounded">{dateString}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
