import { toast as sonnerToast, ExternalToast } from "sonner";

export const toast = {
  success: (message: string, data?: ExternalToast) => {
    sonnerToast.success(message, data);
  },
  error: (message: string, data?: ExternalToast) => {
    sonnerToast.error(message, data);
  },
  warning: (message: string, data?: ExternalToast) => {
    sonnerToast.warning(message, data);
  },
  info: (message: string, data?: ExternalToast) => {
    sonnerToast.info(message, data);
  },
  loading: (message: string, data?: ExternalToast) => {
    return sonnerToast.loading(message, data);
  },
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    data?: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: any) => string);
    }
  ) => {
    sonnerToast.promise(promise, data);
  },
  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },
};
