import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";

interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-[95vw]",
};

export function Modal({
  isOpen,
  open,
  onClose,
  onOpenChange,
  title,
  description,
  children,
  className,
  size,
}: ModalProps) {
  const isVisible = open ?? isOpen ?? false;

  const handleClose = React.useCallback(() => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  }, [onClose, onOpenChange]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isVisible, handleClose]);

  const maxWidthClass = size ? sizeClasses[size] || "max-w-lg" : "max-w-lg";

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md dark:bg-[#020617]/80"
        onClick={handleClose}
      />

      <div
        className={cn(
          "relative w-full bg-card text-card-foreground rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200",
          maxWidthClass,
          className
        )}
      >
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/15 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
            {description && <p className="text-sm text-muted-foreground/80 mt-1">{description}</p>}
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
