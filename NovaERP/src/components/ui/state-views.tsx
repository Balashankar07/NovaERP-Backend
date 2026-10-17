import React from "react";
import { Loader2, AlertCircle, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateViewProps {
  title?: string;
  description?: string;
  message?: string;
  icon?: React.ReactNode | React.ElementType;
  className?: string;
  onRetry?: () => void;
  action?: { label: string; onClick: () => void };
}

function renderIconHelper(icon?: React.ReactNode | React.ElementType, fallback?: React.ReactNode) {
  if (!icon) return fallback;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
    const IconComponent = icon as React.ElementType;
    return <IconComponent className="w-6 h-6 text-muted-foreground" />;
  }
  return fallback;
}

export function LoadingView({ className, title, description, message }: StateViewProps) {
  const displayTitle = title || message || "Loading...";
  const displayDescription = title && message ? message : description;

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 min-h-[300px]", className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
        <Loader2 className="relative w-8 h-8 animate-spin text-primary mb-4" />
      </div>
      <h3 className="text-sm font-medium text-foreground mt-4">{displayTitle}</h3>
      {displayDescription && <p className="text-xs text-muted-foreground mt-1.5 text-center">{displayDescription}</p>}
    </div>
  );
}

export function ErrorView({ className, title, description, message, icon, onRetry }: StateViewProps) {
  const displayTitle = title || "An error occurred";
  const displayDescription = message || description || "Failed to load data. Please try again.";

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 min-h-[300px]", className)}>
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        {renderIconHelper(icon, <AlertCircle className="w-6 h-6 text-destructive" />)}
      </div>
      <h3 className="text-sm font-medium text-foreground">{displayTitle}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 text-center max-w-sm">{displayDescription}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-accent text-xs font-semibold rounded-lg transition-colors duration-200 border border-border/60"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyView({ className, title = "No records found", description = "Get started by creating a new record.", icon, action }: StateViewProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 min-h-[300px] border border-dashed border-border/60 rounded-xl bg-muted/20", className)}>
      <div className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center mb-4 shadow-[var(--shadow-elevation-1)]">
        {renderIconHelper(icon, <FileQuestion className="w-6 h-6 text-muted-foreground" />)}
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 text-center max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/15 text-xs font-semibold rounded-lg transition-colors duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export { EmptyState } from "./EmptyState";
