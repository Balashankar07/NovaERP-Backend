import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";
import type { AuthContextType } from "@/context/auth-context";

/**
 * Hook to access the AuthContext.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
