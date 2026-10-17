import { api } from "@/lib/api-helper";
import { PagedResult } from '../types/common.types';
import { ShipmentDto, CreateShipmentDto, DeliverShipmentDto, DistributionSummaryDto } from '../types/shipments.types';
import { API_ENDPOINTS } from './endpoints';

export const shipmentsApi = {
  getSummary: () =>
    api.get<DistributionSummaryDto>(API_ENDPOINTS.REPORTS.DISTRIBUTION_SUMMARY),

  getAll: (params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: string }) =>
    api.get<PagedResult<ShipmentDto>>('/Shipments', { params }),

  getById: (id: string) =>
    api.get<ShipmentDto>(`/Shipments/${id}`),

  create: (data: CreateShipmentDto) =>
    api.post<ShipmentDto>('/Shipments', data),

  update: (id: string, data: { trackingNumber?: string; courierName?: string }) =>
    api.put(`/Shipments/${id}`, data),

  delete: (id: string) =>
    api.delete(`/Shipments/${id}`),

  dispatch: (id: string) =>
    api.post(`/Shipments/${id}/dispatch`),

  deliver: (id: string, data: DeliverShipmentDto) =>
    api.post(`/Shipments/${id}/deliver`, data),

  cancel: (id: string) =>
    api.post(`/Shipments/${id}/cancel`),
};
