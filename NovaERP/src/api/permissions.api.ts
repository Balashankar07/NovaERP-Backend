import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";

export interface PermissionDto {
  id: string;
  name: string;
  description: string;
  module: string;
}

export const permissionsApi = {
  // Get all available permissions
  getAll: async (): Promise<string[]> => {
    return api.get<string[]>(API_ENDPOINTS.PERMISSIONS.BASE);
  },

  // Get grouped permissions
  getGrouped: async (): Promise<Record<string, PermissionDto[]>> => {
    return api.get<Record<string, PermissionDto[]>>(`${API_ENDPOINTS.PERMISSIONS.BASE}/grouped`);
  },

  // Get permissions assigned to a role (using roles endpoint)
  getByRoleId: async (roleId: string): Promise<any[]> => {
    return api.get<any[]>(API_ENDPOINTS.PERMISSIONS.BY_ROLE_ID(roleId));
  },
};
