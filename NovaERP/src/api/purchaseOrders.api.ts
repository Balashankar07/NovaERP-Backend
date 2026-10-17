import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";
import { PurchaseOrderDto, CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from "@/types/purchaseOrders.types";

export const purchaseOrdersApi = {
  getAll: (params?: PaginationParams & { sortBy?: string, sortOrder?: string }) => 
    api.get<PaginatedResponse<PurchaseOrderDto>>(API_ENDPOINTS.PURCHASE_ORDERS.BASE, { params }),

  getById: (id: string) => 
    api.get<PurchaseOrderDto>(API_ENDPOINTS.PURCHASE_ORDERS.BY_ID(id)),

  create: (data: CreatePurchaseOrderDto) => 
    api.post<PurchaseOrderDto>(API_ENDPOINTS.PURCHASE_ORDERS.BASE, data),

  update: (id: string, data: UpdatePurchaseOrderDto) => 
    api.put<PurchaseOrderDto>(API_ENDPOINTS.PURCHASE_ORDERS.BY_ID(id), data),

  delete: (id: string) => 
    api.delete(API_ENDPOINTS.PURCHASE_ORDERS.BY_ID(id)),

  submit: (id: string) => 
    api.post<PurchaseOrderDto>(`${API_ENDPOINTS.PURCHASE_ORDERS.BY_ID(id)}/submit`),

  send: (id: string) => 
    api.post<PurchaseOrderDto>(`${API_ENDPOINTS.PURCHASE_ORDERS.BY_ID(id)}/send`),

  approve: (id: string) => 
    api.post<PurchaseOrderDto>(`${API_ENDPOINTS.PURCHASE_ORDERS.BY_ID(id)}/approve`),

  reject: (id: string) => 
    api.post<PurchaseOrderDto>(`${API_ENDPOINTS.PURCHASE_ORDERS.BY_ID(id)}/reject`),
};
