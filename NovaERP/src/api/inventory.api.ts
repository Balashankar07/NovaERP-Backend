import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PagedResult } from "@/types";

export interface InventoryDto {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocationId?: string;
  locationName?: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel: number;
  minimumLevel: number;
  maximumLevel: number;
  lastStockUpdate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GlobalInventoryTransactionDto {
  id: string;
  inventoryId: string;
  productId: string;
  productCode: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocationId?: string;
  locationName?: string;
  transactionType: string;
  referenceType: string;
  referenceId?: string;
  quantity: number;
  balanceAfter: number;
  remarks?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface InventoryTransactionDto {
  id: string;
  inventoryId: string;
  transactionType: string;
  referenceType: string;
  referenceId?: string;
  quantity: number;
  balanceAfter: number;
  remarks?: string;
  createdBy?: string;
  createdAt: string;
}

export interface InventorySummaryDto {
  totalProductsInStock: number;
  totalOnHandQuantity: number;
  totalReservedQuantity: number;
  totalAvailableQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
  warehouseCount: number;
  recentMovementCount: number;
}

export interface ReceiveStockDto {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  referenceType: string; // "Manual", "GoodsReceipt", etc.
  referenceId?: string;
  remarks: string;
}

export interface IssueStockDto {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  referenceType: string;
  referenceId?: string;
  remarks: string;
}

export interface ReserveStockDto {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  referenceType: string;
  referenceId?: string;
  remarks: string;
}

export interface ReleaseReservationDto {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  referenceType: string;
  referenceId?: string;
  remarks: string;
}

export interface AdjustStockDto {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantityDelta: number; // can be negative or positive
  reason: string;
}

export interface TransferStockDto {
  productId: string;
  sourceWarehouseId: string;
  sourceLocationId?: string;
  destinationWarehouseId: string;
  destinationLocationId?: string;
  quantity: number;
  reason: string;
}

export const inventoryApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) =>
    api.get<PagedResult<InventoryDto>>(API_ENDPOINTS.INVENTORY.BASE, { params }),

  getById: (id: string) => 
    api.get<InventoryDto>(API_ENDPOINTS.INVENTORY.BY_ID(id)),

  getByProduct: (productId: string) =>
    api.get<InventoryDto[]>(API_ENDPOINTS.INVENTORY.BY_PRODUCT(productId)),

  getByWarehouse: (warehouseId: string, params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) =>
    api.get<PagedResult<InventoryDto>>(API_ENDPOINTS.INVENTORY.BY_WAREHOUSE(warehouseId), { params }),

  getTransactions: (id: string, params?: { pageNumber?: number; pageSize?: number }) =>
    api.get<PagedResult<InventoryTransactionDto>>(API_ENDPOINTS.INVENTORY.TRANSACTIONS_BY_ID(id), { params }),

  getAllTransactions: (params?: { pageNumber?: number; pageSize?: number; search?: string; transactionType?: string; warehouseId?: string; productId?: string; startDate?: string; endDate?: string }) =>
    api.get<PagedResult<GlobalInventoryTransactionDto>>(API_ENDPOINTS.INVENTORY.TRANSACTIONS, { params }),

  getSummary: () =>
    api.get<InventorySummaryDto>(API_ENDPOINTS.REPORTS.INVENTORY_SUMMARY),

  // Movement APIs
  receive: (data: ReceiveStockDto) => 
    api.post<any>(API_ENDPOINTS.INVENTORY.RECEIVE, data),
    
  issue: (data: IssueStockDto) => 
    api.post<any>(API_ENDPOINTS.INVENTORY.ISSUE, data),
    
  reserve: (data: ReserveStockDto) => 
    api.post<any>(API_ENDPOINTS.INVENTORY.RESERVE, data),
    
  release: (data: ReleaseReservationDto) => 
    api.post<any>(API_ENDPOINTS.INVENTORY.RELEASE, data),
    
  adjust: (data: AdjustStockDto) => 
    api.post<any>(API_ENDPOINTS.INVENTORY.ADJUST, data),
    
  transfer: (data: TransferStockDto) => 
    api.post<any>(API_ENDPOINTS.INVENTORY.TRANSFER, data),
};
