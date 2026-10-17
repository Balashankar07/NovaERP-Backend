import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { Role, CreateRoleRequest, UpdateRoleRequest } from "@/types";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";

/**
 * Role API service — consumes backend Role endpoints.
 */
export const roleApi = {
  /**
   * GET /api/Role
   */
  getAll: (params?: PaginationParams & { sortBy?: string, sortOrder?: string }): Promise<PaginatedResponse<Role>> => 
    api.get<PaginatedResponse<Role>>(API_ENDPOINTS.ROLE.BASE, { params }),

  /**
   * GET /api/Role/{id}
   */
  getById: (id: string): Promise<Role> => 
    api.get<Role>(API_ENDPOINTS.ROLE.BY_ID(id)),

  /**
   * POST /api/Role
   */
  create: (data: CreateRoleRequest): Promise<Role> => 
    api.post<Role>(API_ENDPOINTS.ROLE.BASE, data),

  /**
   * PUT /api/Role/{id}
   */
  update: (id: string, data: UpdateRoleRequest): Promise<void> => 
    api.put<void>(API_ENDPOINTS.ROLE.BY_ID(id), data),

  /**
   * DELETE /api/admin/roles/{id}
   */
  delete: (id: string): Promise<void> => 
    api.delete<void>(API_ENDPOINTS.ROLE.BY_ID(id)),

  /**
   * POST /api/admin/roles/bulk-delete
   */
  bulkDelete: (ids: string[]): Promise<void> =>
    api.post<void>(`${API_ENDPOINTS.ROLE.BASE}/bulk-delete`, ids),

  /**
   * PATCH /api/admin/roles/{id}/activate
   */
  activate: (id: string): Promise<void> =>
    api.patch<void>(`${API_ENDPOINTS.ROLE.BY_ID(id)}/activate`),

  /**
   * PATCH /api/admin/roles/{id}/deactivate
   */
  deactivate: (id: string): Promise<void> =>
    api.patch<void>(`${API_ENDPOINTS.ROLE.BY_ID(id)}/deactivate`),

  /**
   * GET /api/admin/roles/{id}/users
   */
  getUsers: (id: string): Promise<any[]> =>
    api.get<any[]>(`${API_ENDPOINTS.ROLE.BY_ID(id)}/users`),

  /**
   * GET /api/admin/roles/{id}/permissions
   */
  getPermissions: (id: string): Promise<any[]> =>
    api.get<any[]>(`${API_ENDPOINTS.ROLE.BY_ID(id)}/permissions`),

  /**
   * POST /api/admin/roles/{id}/permissions/{permissionId}
   */
  assignPermission: (id: string, permissionId: string): Promise<void> =>
    api.post<void>(`${API_ENDPOINTS.ROLE.BY_ID(id)}/permissions/${permissionId}`),

  /**
   * DELETE /api/admin/roles/{id}/permissions/{permissionId}
   */
  removePermission: (id: string, permissionId: string): Promise<void> =>
    api.delete<void>(`${API_ENDPOINTS.ROLE.BY_ID(id)}/permissions/${permissionId}`),
};
