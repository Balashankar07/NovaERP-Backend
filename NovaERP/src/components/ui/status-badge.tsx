import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  isActive?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
  status?: "active" | "inactive" | "success" | "warning" | "error" | "info" | "pending" | "in_progress" | "draft" | string;
  label?: string;
}

export function StatusBadge({ 
  isActive, 
  activeLabel = "Active", 
  inactiveLabel = "Inactive",
  status,
  label,
  className 
}: StatusBadgeProps) {
  const normalizedStatus = (status || (isActive ? "active" : "inactive")).toLowerCase();
  const displayLabel = label || (normalizedStatus === "active" || normalizedStatus === "success" ? activeLabel : (normalizedStatus === "inactive" ? inactiveLabel : status));

  if (normalizedStatus === "active" || normalizedStatus === "success" || normalizedStatus === "approved" || normalizedStatus === "completed") {
    return (
      <Badge variant="outline" className={cn("bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold px-2.5 py-0.5 rounded-full flex w-fit items-center gap-1.5 shadow-2xs", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
        {displayLabel}
      </Badge>
    );
  }

  if (normalizedStatus === "warning" || normalizedStatus === "pending" || normalizedStatus === "in_review" || normalizedStatus === "low_stock") {
    return (
      <Badge variant="outline" className={cn("bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold px-2.5 py-0.5 rounded-full flex w-fit items-center gap-1.5 shadow-2xs", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
        {displayLabel}
      </Badge>
    );
  }

  if (normalizedStatus === "info" || normalizedStatus === "in_progress" || normalizedStatus === "processing" || normalizedStatus === "issued") {
    return (
      <Badge variant="outline" className={cn("bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-semibold px-2.5 py-0.5 rounded-full flex w-fit items-center gap-1.5 shadow-2xs", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
        {displayLabel}
      </Badge>
    );
  }

  if (normalizedStatus === "draft") {
    return (
      <Badge variant="outline" className={cn("bg-slate-500/10 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-semibold px-2.5 py-0.5 rounded-full flex w-fit items-center gap-1.5 shadow-2xs", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
        {displayLabel}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold px-2.5 py-0.5 rounded-full flex w-fit items-center gap-1.5 shadow-2xs", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
      {displayLabel}
    </Badge>
  );
}
