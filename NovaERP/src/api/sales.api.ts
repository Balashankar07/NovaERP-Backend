import { api } from "@/lib/api-helper";
import { PagedResult } from '../types/common.types';
import { SalesOrderDto, CreateSalesOrderDto, UpdateSalesOrderDto, SalesSummaryDto } from '../types/sales.types';
import { API_ENDPOINTS } from './endpoints';

export const salesApi = {
  getSummary: () =>
    api.get<SalesSummaryDto>(API_ENDPOINTS.REPORTS.SALES_SUMMARY),

  getSalesOrders: (params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: string }) =>
    api.get<PagedResult<SalesOrderDto>>('/SalesOrders', { params }),
    
  getSalesOrderById: (id: string) =>
    api.get<SalesOrderDto>(`/SalesOrders/${id}`),
    
  createSalesOrder: (data: CreateSalesOrderDto) =>
    api.post<SalesOrderDto>('/SalesOrders', data),
    
  updateSalesOrder: (id: string, data: UpdateSalesOrderDto) =>
    api.put<SalesOrderDto>(`/SalesOrders/${id}`, data),
    
  deleteSalesOrder: (id: string) =>
    api.delete(`/SalesOrders/${id}`),
    
  submitSalesOrder: (id: string) =>
    api.post<SalesOrderDto>(`/SalesOrders/${id}/submit`),
    
  approveSalesOrder: (id: string) =>
    api.post<SalesOrderDto>(`/SalesOrders/${id}/approve`),
    
  rejectSalesOrder: (id: string) =>
    api.post<SalesOrderDto>(`/SalesOrders/${id}/reject`),

  reserveSalesOrder: (id: string) =>
    api.post<SalesOrderDto>(`/SalesOrders/${id}/reserve`),
    
  cancelSalesOrder: (id: string, reason: string) =>
    api.post<SalesOrderDto>(`/SalesOrders/${id}/cancel`, null, { params: { reason } }),
};

export const salesOrdersApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: string }) =>
    salesApi.getSalesOrders(params),
  getById: (id: string) => salesApi.getSalesOrderById(id),
  create: (data: any) => salesApi.createSalesOrder(data),
  update: (id: string, data: any) => salesApi.updateSalesOrder(id, data),
  delete: (id: string) => salesApi.deleteSalesOrder(id),
  submit: (id: string) => salesApi.submitSalesOrder(id),
  approve: (id: string) => salesApi.approveSalesOrder(id),
  reject: (id: string) => salesApi.rejectSalesOrder(id),
  reserve: (id: string) => salesApi.reserveSalesOrder(id),
  cancel: (id: string, reason: string) => salesApi.cancelSalesOrder(id, reason),
};
