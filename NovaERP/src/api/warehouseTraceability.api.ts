import { api } from "@/lib/api-helper";
import { PagedResult } from '../types/common.types';
import {
  HierarchicalLocation,
  CreateHierarchicalLocationDto,
  InventoryBatch,
  CreateInventoryBatchDto,
  UpdateBatchStatusDto,
  InventorySerialNumber,
  RegisterSerialNumbersDto,
  UpdateSerialStatusDto,
  UpdateProductTrackingModeDto,
  TraceabilityNode,
  TraceabilityReportsSummary,
  BatchStatus,
  SerialStatus
} from '../types/warehouseTraceability.types';

export const warehouseTraceabilityApi = {
  // Location Hierarchy
  getLocationHierarchy: (warehouseId: string) =>
    api.get<HierarchicalLocation[]>(`/WarehouseTraceability/locations/hierarchy/${warehouseId}`),

  createLocation: (data: CreateHierarchicalLocationDto) =>
    api.post<HierarchicalLocation>('/WarehouseTraceability/locations', data),

  // Product Tracking Mode
  updateTrackingMode: (productId: string, data: UpdateProductTrackingModeDto) =>
    api.put<void>(`/WarehouseTraceability/products/${productId}/tracking-mode`, data),

  // Batches
  getBatches: (params?: { pageNumber?: number; pageSize?: number; productId?: string; warehouseId?: string; status?: BatchStatus }) =>
    api.get<PagedResult<InventoryBatch>>('/WarehouseTraceability/batches', { params }),

  createBatch: (data: CreateInventoryBatchDto) =>
    api.post<InventoryBatch>('/WarehouseTraceability/batches', data),

  updateBatchStatus: (batchId: string, data: UpdateBatchStatusDto) =>
    api.put<InventoryBatch>(`/WarehouseTraceability/batches/${batchId}/status`, data),

  // Serials
  getSerials: (params?: { pageNumber?: number; pageSize?: number; productId?: string; warehouseId?: string; status?: SerialStatus }) =>
    api.get<PagedResult<InventorySerialNumber>>('/WarehouseTraceability/serials', { params }),

  registerSerials: (data: RegisterSerialNumbersDto) =>
    api.post<InventorySerialNumber[]>('/WarehouseTraceability/serials', data),

  updateSerialStatus: (serialId: string, data: UpdateSerialStatusDto) =>
    api.put<InventorySerialNumber>(`/WarehouseTraceability/serials/${serialId}/status`, data),

  // Damaged / Blocked Stock
  getDamagedOrBlockedBatches: (params?: { pageNumber?: number; pageSize?: number }) =>
    api.get<PagedResult<InventoryBatch>>('/WarehouseTraceability/damaged-blocked/batches', { params }),

  getDamagedOrBlockedSerials: (params?: { pageNumber?: number; pageSize?: number }) =>
    api.get<PagedResult<InventorySerialNumber>>('/WarehouseTraceability/damaged-blocked/serials', { params }),

  // Traceability & Reports
  getProductTraceability: (productId: string) =>
    api.get<TraceabilityNode>(`/WarehouseTraceability/trace/${productId}`),

  getReportsSummary: () =>
    api.get<TraceabilityReportsSummary>('/WarehouseTraceability/reports/summary'),
};
