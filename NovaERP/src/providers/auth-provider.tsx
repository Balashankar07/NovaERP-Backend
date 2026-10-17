import { useState, useCallback, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/context/auth-context";
import { storage } from "@/utils/storage";
import { toast } from "@/utils/toast";
import type { CurrentUser } from "@/types";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Validate existing token on load to prevent false "session expired" redirects
  const initialToken = storage.getToken();
  let initialUser = storage.getUser<CurrentUser>();
  
  if (initialToken) {
    try {
      const payload = JSON.parse(atob(initialToken.split('.')[1]));
      if (payload.exp * 1000 <= Date.now()) {
        storage.clearAll();
        initialUser = null;
      }
    } catch (e) {
      storage.clearAll();
      initialUser = null;
    }
  }

  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const [token, setToken] = useState<string | null>(initialUser ? initialToken : null);
  const isLoading = false;

  const login = useCallback((newToken: string, newUser: CurrentUser, rememberMe: boolean = false) => {
    storage.setToken(newToken, rememberMe);
    storage.setUser(newUser, rememberMe);
    queryClient.clear();
    setToken(newToken);
    setUser(newUser);
    
    const getDisplayName = (email: string) => {
      const namePart = email.split("@")[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    };
    
    toast.success(`Welcome back, ${getDisplayName(newUser.email)}!`);
  }, [queryClient]);

  const logout = useCallback(() => {
    storage.clearAll();
    queryClient.clear();
    setToken(null);
    setUser(null);
    toast.success("Logged out successfully.");
  }, [queryClient]);

  useEffect(() => {
    const handleSessionExpired = () => {
      storage.clearAll();
      queryClient.clear();
      setToken(null);
      setUser(null);
      toast.error("Your session has expired. Please log in again.");
      navigate("/login?expired=true");
    };

    window.addEventListener("session:expired", handleSessionExpired);
    return () => {
      window.removeEventListener("session:expired", handleSessionExpired);
    };
  }, [navigate, queryClient]);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
