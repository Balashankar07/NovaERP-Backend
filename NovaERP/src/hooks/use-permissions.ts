import { useCallback } from "react";
import { CurrentUser } from "@/types";
import { ROUTES } from "@/routes";
import { useAuth } from "./use-auth";

// Centralized system-level safeguard to prevent lockout
export const SYSTEM_SAFEGUARD_ROLE = "Super Admin";

export function getDefaultRouteForUser(user: CurrentUser | null): string {
  if (!user) return ROUTES.DASHBOARD;

  if (user.role === SYSTEM_SAFEGUARD_ROLE) {
    return ROUTES.DASHBOARD;
  }

  // Permission-based & role-based default routing for operational roles
  if (user.role === "Procurement Manager" || user.permissions?.includes("Permissions.PurchaseRequests.View") || user.permissions?.includes("Permissions.PurchaseOrders.View")) {
    return ROUTES.DASHBOARD_PROCUREMENT;
  }
  if (user.role === "Production Manager" || user.permissions?.includes("Permissions.ProductionOrders.View") || user.permissions?.includes("Permissions.ProductionExecution.View")) {
    return ROUTES.DASHBOARD_PRODUCTION;
  }
  if (user.role === "Warehouse Manager" || user.permissions?.includes("Permissions.Inventory.Adjust") || user.permissions?.includes("Permissions.GoodsReceipts.Receive")) {
    return ROUTES.DASHBOARD_WAREHOUSE;
  }
  if (user.role === "Quality Engineer" || user.permissions?.includes("Permissions.QualityInspection.Complete") || user.permissions?.includes("Permissions.QualityInspection.View")) {
    return ROUTES.DASHBOARD_QUALITY;
  }
  if (user.role === "Sales Manager" || user.permissions?.includes("Permissions.SalesOrders.Approve") || user.permissions?.includes("Permissions.SalesOrders.View")) {
    return ROUTES.DASHBOARD_SALES;
  }
  if (user.role === "Warranty Executive" || user.permissions?.includes("Permissions.Warranties.Claim") || user.permissions?.includes("Permissions.Warranties.View")) {
    return ROUTES.DASHBOARD_WARRANTY;
  }
  if (user.permissions?.includes("Permissions.Inventory.View")) {
    return ROUTES.DASHBOARD_WAREHOUSE;
  }

  // Fallback
  return ROUTES.DASHBOARD;
}

export function usePermissions() {
  const { user } = useAuth();

  // useCallback gives hasPermission a stable reference so components that depend
  // on it inside useEffect / useCallback don't re-fire on every render.
  const hasPermission = useCallback(
    (permission: string | string[]): boolean => {
      if (!user) return false;

      // System safeguard override
      if (user.role === SYSTEM_SAFEGUARD_ROLE) return true;

      // UX HOTFIX: Allow Warehouse Manager to view Sales Orders without needing to relog to refresh token.
      if (user.role === "Warehouse Manager" && (permission === "Permissions.SalesOrders.View" || (Array.isArray(permission) && permission.includes("Permissions.SalesOrders.View")))) {
        return true;
      }

      // UX HOTFIX: Allow Sales Manager to create Shipments from the sales order page.
      if (user.role === "Sales Manager" && (permission === "Permissions.Shipments.Create" || (Array.isArray(permission) && permission.includes("Permissions.Shipments.Create")))) {
        return true;
      }

      // IMPORTANT: Per enterprise architecture rules, the frontend MUST NOT
      // infer permissions from business roles to avoid duplicating backend logic.
      // The backend is the single source of truth.
      //
      // If the backend JWT token (or a future endpoint) provides verified permissions,
      // we consume them here.
      if ("permissions" in user && Array.isArray((user as any).permissions)) {
        const userPerms = (user as any).permissions as string[];
        if (Array.isArray(permission)) {
          return permission.some((p) => userPerms.includes(p));
        }
        return userPerms.includes(permission);
      }

      // In the absence of a verified permissions claim from the backend, we DO NOT
      // grant UI access. This avoids the flash of unauthorized content and /403 loops.
      return false;
    },
    [user]
  );

  return { hasPermission };
}
