import { api } from "@/lib/api-helper";
import {
  AdminOverview,
  AdminSecurityData,
  AdminModuleStatus,
  AdminHealthStatus,
  AdminSystemConfig,
  AdminSystemInfo,
  RolePermissionMatrix,
  ToggleRolePermissionRequest,
} from "@/types/admin.types";

export const adminApi = {
  getOverview: (): Promise<AdminOverview> =>
    api.get<AdminOverview>("/admin/overview"),

  getSecurityOverview: (): Promise<AdminSecurityData> =>
    api.get<AdminSecurityData>("/admin/security"),

  getModuleStatuses: (): Promise<AdminModuleStatus[]> =>
    api.get<AdminModuleStatus[]>("/admin/module-status"),

  getSystemHealth: (): Promise<AdminHealthStatus[]> =>
    api.get<AdminHealthStatus[]>("/admin/system/health"),

  getSystemConfig: (): Promise<AdminSystemConfig> =>
    api.get<AdminSystemConfig>("/admin/system/config"),

  getSystemInfo: (): Promise<AdminSystemInfo> =>
    api.get<AdminSystemInfo>("/admin/system/info"),

  getPermissionMatrix: (): Promise<RolePermissionMatrix> =>
    api.get<RolePermissionMatrix>("/admin/permissions/matrix"),

  togglePermission: (data: ToggleRolePermissionRequest): Promise<void> =>
    api.post<void>("/admin/permissions/matrix/toggle", data),
};
