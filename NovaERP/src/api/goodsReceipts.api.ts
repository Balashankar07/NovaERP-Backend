import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PagedResult } from "@/types";
import { 
  GoodsReceiptDto, 
  CreateGoodsReceiptDto, 
  UpdateGoodsReceiptDto 
} from "@/types/goodsReceipts.types";

export const goodsReceiptsApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) =>
    api.get<PagedResult<GoodsReceiptDto>>(API_ENDPOINTS.GOODS_RECEIPTS.BASE, { params }),

  getById: (id: string) => 
    api.get<GoodsReceiptDto>(API_ENDPOINTS.GOODS_RECEIPTS.BY_ID(id)),

  create: (data: CreateGoodsReceiptDto) => 
    api.post<GoodsReceiptDto>(API_ENDPOINTS.GOODS_RECEIPTS.BASE, data),

  update: (id: string, data: UpdateGoodsReceiptDto) => 
    api.put<GoodsReceiptDto>(API_ENDPOINTS.GOODS_RECEIPTS.BY_ID(id), data),

  delete: (id: string) => 
    api.delete(API_ENDPOINTS.GOODS_RECEIPTS.BY_ID(id)),

  receive: (id: string) =>
    api.post<GoodsReceiptDto>(`${API_ENDPOINTS.GOODS_RECEIPTS.BY_ID(id)}/receive`),

  cancel: (id: string) =>
    api.post<GoodsReceiptDto>(`${API_ENDPOINTS.GOODS_RECEIPTS.BY_ID(id)}/cancel`),
};
