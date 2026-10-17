import { AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  title?: string;
  message: string;
  type?: "error" | "warning";
  className?: string;
}

export function ErrorBanner({ title, message, type = "error", className }: ErrorBannerProps) {
  const isError = type === "error";
  const Icon = isError ? XCircle : AlertTriangle;
  
  return (
    <div 
      className={cn(
        "border-l-4 p-4 mb-6 rounded-r-md",
        isError ? "bg-red-50 border-red-500" : "bg-amber-50 border-amber-500",
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        <Icon 
          className={cn(
            "w-5 h-5 mt-0.5 mr-3 shrink-0",
            isError ? "text-red-500" : "text-amber-500"
          )} 
          aria-hidden="true" 
        />
        <div>
          {title && (
            <h3 className={cn(
              "text-sm font-medium",
              isError ? "text-red-800" : "text-amber-800"
            )}>
              {title}
            </h3>
          )}
          <p className={cn(
            "text-sm",
            title ? "mt-1" : "",
            isError ? "text-red-700" : "text-amber-700"
          )}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
