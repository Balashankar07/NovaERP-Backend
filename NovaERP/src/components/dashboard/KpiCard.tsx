import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  iconColorClass?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, trendUp, subtitle, iconColorClass }: KpiCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 border-border/50 bg-card stat-card-hover">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/[0.04] blur-2xl group-hover:bg-primary/[0.08] group-hover:scale-110 transition-all duration-700" />
      <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-primary/[0.02] blur-xl group-hover:bg-primary/[0.05] transition-all duration-700" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">{title}</CardTitle>
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
          iconColorClass
        )}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10 pt-1">
        <div className="text-2.5xl font-extrabold tracking-tight text-foreground">{value}</div>
        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
          {trend ? (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-tight shadow-xs",
                trendUp 
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
              )}
            >
              {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{trendUp ? "+" : ""}{trend}</span>
            </span>
          ) : null}
          {subtitle && (
            <span className="text-[11px] text-muted-foreground/70 font-medium truncate">
              {subtitle}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
