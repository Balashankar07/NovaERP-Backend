import axios from "axios";
import { toast } from "@/utils/toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle global errors and toasts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error("Unable to connect to the server.");
      return Promise.reject(error);
    }

    const status = error.response.status;

    switch (status) {
      case 401:
        // Do not trigger session:expired for login endpoints or link-google
        if (
          error.config?.url?.includes("/login") || 
          error.config?.url?.includes("/google-signin") || 
          error.config?.url?.includes("/link-google")
        ) {
          break;
        }
        // Dispatch event instead of hard page reload to preserve UX state
        window.dispatchEvent(new Event("session:expired"));
        break;
      case 403:
        toast.error("You do not have permission to perform this action.");
        break;
      case 404:
        toast.error("Requested resource was not found.");
        break;
      case 500:
        toast.error("Something went wrong. Please try again later.");
        break;
      // Note: 400, 409, and 422 are deliberately ignored here.
      // They are handled by the specific form validation hooks to prevent duplicate generic toasts.
    }

    return Promise.reject(error);
  }
);

export default apiClient;
