import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import type { 
  PaginatedResponse, 
  PaginationParams,
} from "@/types";
import {
  BOMDto,
  CreateBOMDto,
  UpdateBOMDto
} from "@/types/boms.types";

export const bomsApi = {
  getAll: (params?: PaginationParams & { sortBy?: string, sortOrder?: string }) => 
    api.get<PaginatedResponse<BOMDto>>(API_ENDPOINTS.BOM.BASE, { params }),

  getById: (id: string) => 
    api.get<BOMDto>(API_ENDPOINTS.BOM.BY_ID(id)),

  create: (data: CreateBOMDto) => 
    api.post<BOMDto>(API_ENDPOINTS.BOM.BASE, data),

  update: (id: string, data: UpdateBOMDto) => 
    api.put<BOMDto>(API_ENDPOINTS.BOM.BY_ID(id), data),

  delete: (id: string) => 
    api.delete<boolean>(API_ENDPOINTS.BOM.BY_ID(id)),

  activate: (id: string) => 
    api.patch<void>(API_ENDPOINTS.BOM.ACTIVATE(id)),

  deactivate: (id: string) => 
    api.patch<void>(API_ENDPOINTS.BOM.DEACTIVATE(id))
};
