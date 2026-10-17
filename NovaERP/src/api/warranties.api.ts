import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PagedResult } from "@/types";

export interface WarrantyDto {
  id: string;
  warrantyNumber: string;
  salesOrderId?: string;
  productId: string;
  productName?: string;
  productCode?: string;
  customerName?: string;
  customerEmail?: string;
  serialNumber?: string;
  warrantyType: string;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  createdAt?: string;
}

export interface WarrantyClaimDto {
  id: string;
  claimNumber: string;
  warrantyId: string;
  warrantyNumber?: string;
  claimDate: string;
  issueDescription: string;
  resolution?: string;
  status: string;
  createdAt?: string;
}

import { WarrantySummaryDto } from "@/types/reports.types";

export const warrantiesApi = {
  getSummary: () =>
    api.get<WarrantySummaryDto>(API_ENDPOINTS.REPORTS.WARRANTY_SUMMARY),
  getAll: (params?: { pageNumber?: number; pageSize?: number; search?: string }) =>
    api.get<PagedResult<WarrantyDto>>(API_ENDPOINTS.WARRANTIES.BASE, { params }),
  getById: (id: string) =>
    api.get<WarrantyDto>(API_ENDPOINTS.WARRANTIES.BY_ID(id)),
  close: (id: string) =>
    api.put<WarrantyDto>(API_ENDPOINTS.WARRANTIES.CLOSE(id)),
};

export const warrantyClaimsApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; search?: string }) =>
    api.get<PagedResult<WarrantyClaimDto>>(API_ENDPOINTS.WARRANTY_CLAIMS.BASE, { params }),
  getById: (id: string) =>
    api.get<WarrantyClaimDto>(API_ENDPOINTS.WARRANTY_CLAIMS.BY_ID(id)),
  create: (dto: any) =>
    api.post<WarrantyClaimDto>(API_ENDPOINTS.WARRANTY_CLAIMS.BASE, dto),
  approve: (id: string) =>
    api.put<WarrantyClaimDto>(API_ENDPOINTS.WARRANTY_CLAIMS.APPROVE(id)),
  reject: (id: string) =>
    api.put<WarrantyClaimDto>(API_ENDPOINTS.WARRANTY_CLAIMS.REJECT(id)),
  resolve: (id: string, resolution: string) =>
    api.put<WarrantyClaimDto>(API_ENDPOINTS.WARRANTY_CLAIMS.RESOLVE(id), { resolution }),
  close: (id: string) =>
    api.put<WarrantyClaimDto>(API_ENDPOINTS.WARRANTY_CLAIMS.CLOSE(id)),
};
