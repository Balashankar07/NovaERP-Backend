import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from "@/providers/theme-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "333025909649-j9qhvacjb02h109entf37t06915epqpv.apps.googleusercontent.com";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider defaultTheme="system" storageKey="nova_ui_theme">
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);
