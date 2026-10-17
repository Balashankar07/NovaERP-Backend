import { AuditLog } from "@/types";

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
  canonicalRoles: string[];
  roleUserCounts: Record<string, number>;
  totalPermissions: number;
  permissionsByModule: Record<string, number>;
  totalSecurityAlerts: number;
  recentSecurityAlerts: AdminSecurityAlert[];
  systemHealth: AdminHealthStatus[];
  moduleStatuses: AdminModuleStatus[];
}

export interface AdminSecurityAlert {
  id: string;
  timestamp: string;
  eventType: "FailedLogin" | "InactiveLoginAttempt" | "PermissionDenied";
  userIdentifier: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface AdminSecurityData {
  loginActivity: AuditLog[];
  failedAttempts: AdminSecurityAlert[];
  authorizationEvents: AdminSecurityAlert[];
}

export interface AdminHealthStatus {
  component: string; // "API", "Database", "Authentication", "Audit logging", "Reports"
  status: "Operational" | "Degraded" | "Unavailable";
  details: string;
  responseTimeMs: number;
  checkedAt: string;
}

export interface AdminModuleStatus {
  moduleName: string;
  status: "Operational" | "Degraded" | "Unavailable";
  recordCount: number;
  lastActivity?: string;
  route: string;
  errorDetails?: string;
}

export interface AdminSystemConfig {
  appName: string;
  environment: string;
  defaultCurrency: string;
  timeZone: string;
  sessionTimeoutMinutes: number;
  databaseProvider: string;
  auditLoggingEnabled: boolean;
  multiFactorAuthRequired: boolean;
  maxFailedLoginAttempts: number;
}

export interface AdminSystemInfo {
  appName: string;
  version: string;
  environment: string;
  backendVersion: string;
  frontendVersion: string;
  databaseProvider: string;
  apiVersion: string;
  serverTime: string;
}

export interface RoleMatrixHeader {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
}

export interface PermissionMatrixRow {
  permissionId: string;
  permissionName: string;
  description: string;
  module: string;
  roleMap: Record<string, boolean>;
}

export interface RolePermissionMatrix {
  roles: RoleMatrixHeader[];
  modules: string[];
  rows: PermissionMatrixRow[];
}

export interface ToggleRolePermissionRequest {
  roleId: string;
  permissionId: string;
  isGranted: boolean;
}
