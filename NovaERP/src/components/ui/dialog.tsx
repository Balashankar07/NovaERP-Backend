import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{ onClose: () => void }>({ onClose: () => {} });

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const handleClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, handleClose]);

  if (!open) return null;

  return createPortal(
    <DialogContext.Provider value={{ onClose: handleClose }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200 p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </DialogContext.Provider>,
    document.body
  );
};

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cn("space-y-4", className)}>{children}</div>;
};

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { onClose } = React.useContext(DialogContext);
  return (
    <div className={cn("pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between", className)}>
      <div className="flex-1">{children}</div>
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 -mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <h3 className={cn("text-lg font-semibold text-slate-900 dark:text-slate-100", className)}>{children}</h3>;
};

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cn("pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-4", className)}>{children}</div>;
};

export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <p className={cn("text-xs text-slate-500 dark:text-slate-400 mt-1", className)}>{children}</p>;
};

