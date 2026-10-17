import React from "react";
import { FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode | React.ElementType;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action,
  className 
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return <FileQuestion className="w-6 h-6 text-muted-foreground" />;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
      const IconComponent = icon as React.ElementType;
      return <IconComponent className="w-6 h-6 text-muted-foreground" />;
    }
    return <FileQuestion className="w-6 h-6 text-muted-foreground" />;
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-12 min-h-[300px] border border-dashed border-border/60 rounded-xl bg-muted/20", className)}>
      <div className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center mb-4 shadow-[var(--shadow-elevation-1)]">
        {renderIcon()}
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
