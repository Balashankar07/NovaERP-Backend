import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { User, CreateUserRequest, UpdateUserRequest } from "@/types";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";

/**
 * User API service — consumes backend User endpoints.
 */
export const userApi = {
  /**
   * GET /api/User
   */
  getAll: (params?: PaginationParams & { sortBy?: string, sortOrder?: string }): Promise<PaginatedResponse<User>> => 
    api.get<PaginatedResponse<User>>(API_ENDPOINTS.USER.BASE, { params }),

  /**
   * GET /api/User/{id}
   */
  getById: (id: string): Promise<User> => 
    api.get<User>(API_ENDPOINTS.USER.BY_ID(id)),

  /**
   * POST /api/User
   */
  create: (data: CreateUserRequest): Promise<User> => 
    api.post<User>(API_ENDPOINTS.USER.BASE, data),

  /**
   * PUT /api/User/{id}
   */
  update: (id: string, data: UpdateUserRequest): Promise<void> => 
    api.put<void>(API_ENDPOINTS.USER.BY_ID(id), data),

  /**
   * DELETE /api/User/{id}
   */
  delete: (id: string): Promise<void> => 
    api.delete<void>(API_ENDPOINTS.USER.BY_ID(id)),

  /**
   * POST /api/admin/users/bulk-delete
   */
  bulkDelete: (ids: string[]): Promise<void> =>
    api.post<void>(`${API_ENDPOINTS.USER.BASE}/bulk-delete`, ids),

  /**
   * PATCH /api/admin/users/{id}/activate
   */
  activate: (id: string): Promise<void> =>
    api.patch<void>(`${API_ENDPOINTS.USER.BY_ID(id)}/activate`),

  /**
   * PATCH /api/admin/users/{id}/deactivate
   */
  deactivate: (id: string): Promise<void> =>
    api.patch<void>(`${API_ENDPOINTS.USER.BY_ID(id)}/deactivate`),

  /**
   * GET /api/admin/users/{id}/roles
   */
  getRoles: (id: string): Promise<any[]> =>
    api.get<any[]>(`${API_ENDPOINTS.USER.BY_ID(id)}/roles`),

  /**
   * POST /api/admin/users/{id}/roles/{roleId}
   */
  assignRole: (id: string, roleId: string): Promise<void> =>
    api.post<void>(`${API_ENDPOINTS.USER.BY_ID(id)}/roles/${roleId}`),

  /**
   * DELETE /api/admin/users/{id}/roles/{roleId}
   */
  removeRole: (id: string, roleId: string): Promise<void> =>
    api.delete<void>(`${API_ENDPOINTS.USER.BY_ID(id)}/roles/${roleId}`),

  /**
   * GET /api/AuditLogs/user/{userId}
   */
  getActivity: (userId: string): Promise<any[]> =>
    api.get<any[]>(`/AuditLogs/user/${userId}`),
};
