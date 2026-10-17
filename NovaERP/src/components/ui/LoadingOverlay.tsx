import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ isLoading, message = "Processing...", className }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className={cn("absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg", className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
        <Loader2 className="relative w-8 h-8 animate-spin text-primary mb-2" />
      </div>
      {message && <p className="text-sm font-medium text-foreground mt-3">{message}</p>}
    </div>
  );
}
