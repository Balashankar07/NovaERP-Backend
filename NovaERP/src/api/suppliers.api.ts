import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";
import { SupplierDto, CreateSupplierDto, UpdateSupplierDto } from "@/types/suppliers.types";

export const suppliersApi = {
  getAll: (params?: PaginationParams & { sortBy?: string, sortOrder?: string, isActive?: boolean }) => 
    api.get<PaginatedResponse<SupplierDto>>(API_ENDPOINTS.SUPPLIERS.BASE, { params }),

  getById: (id: string) => 
    api.get<SupplierDto>(API_ENDPOINTS.SUPPLIERS.BY_ID(id)),

  create: (data: CreateSupplierDto) => 
    api.post<SupplierDto>(API_ENDPOINTS.SUPPLIERS.BASE, data),

  update: (id: string, data: UpdateSupplierDto) => 
    api.put<SupplierDto>(API_ENDPOINTS.SUPPLIERS.BY_ID(id), data),

  delete: (id: string) => 
    api.delete<boolean>(API_ENDPOINTS.SUPPLIERS.BY_ID(id)),
    
  activate: (id: string) => 
    api.patch<void>(API_ENDPOINTS.SUPPLIERS.ACTIVATE(id)),

  deactivate: (id: string) => 
    api.patch<void>(API_ENDPOINTS.SUPPLIERS.DEACTIVATE(id))
};
