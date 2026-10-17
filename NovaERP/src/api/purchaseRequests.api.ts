import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";
import { PurchaseRequestDto, CreatePurchaseRequestDto, UpdatePurchaseRequestDto } from "@/types/purchaseRequests.types";

export const purchaseRequestsApi = {
  getAll: (params?: PaginationParams & { sortBy?: string, sortOrder?: string, status?: string, priority?: string, source?: string }) => 
    api.get<PaginatedResponse<PurchaseRequestDto>>(API_ENDPOINTS.PURCHASE_REQUESTS.BASE, { params }),

  getById: (id: string) => 
    api.get<PurchaseRequestDto>(API_ENDPOINTS.PURCHASE_REQUESTS.BY_ID(id)),

  create: (data: CreatePurchaseRequestDto) => 
    api.post<PurchaseRequestDto>(API_ENDPOINTS.PURCHASE_REQUESTS.BASE, data),

  update: (id: string, data: UpdatePurchaseRequestDto) => 
    api.put<PurchaseRequestDto>(API_ENDPOINTS.PURCHASE_REQUESTS.BY_ID(id), data),

  delete: (id: string) => 
    api.delete(API_ENDPOINTS.PURCHASE_REQUESTS.BY_ID(id)),

  submit: (id: string) => 
    api.post<PurchaseRequestDto>(`${API_ENDPOINTS.PURCHASE_REQUESTS.BY_ID(id)}/submit`),

  approve: (id: string) => 
    api.post<PurchaseRequestDto>(`${API_ENDPOINTS.PURCHASE_REQUESTS.BY_ID(id)}/approve`),

  reject: (id: string, rejectionReason: string) => 
    api.post<PurchaseRequestDto>(`${API_ENDPOINTS.PURCHASE_REQUESTS.BY_ID(id)}/reject`, { rejectionReason }),
};
