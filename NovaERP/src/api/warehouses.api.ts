import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { PagedResult } from "@/types";

export interface WarehouseLocationDto {
  id: string;
  warehouseId: string;
  locationName: string;
  locationCode: string;
  zone?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  isActive: boolean;
  inventoryItemCount?: number;
}

export interface WarehouseDto {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  address?: string;
  managerName?: string;
  isDefault: boolean;
  isActive: boolean;
  locationCount?: number;
  locations?: WarehouseLocationDto[];
}

export interface CreateWarehouseDto {
  warehouseCode: string;
  warehouseName: string;
  address?: string;
  managerName?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface UpdateWarehouseDto {
  warehouseCode: string;
  warehouseName: string;
  address?: string;
  managerName?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CreateWarehouseLocationDto {
  warehouseId: string;
  locationCode: string;
  locationName: string;
  zone?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  isActive: boolean;
}

export interface UpdateWarehouseLocationDto {
  locationCode: string;
  locationName: string;
  zone?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  isActive: boolean;
}

export const warehousesApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) =>
    api.get<PagedResult<WarehouseDto>>(API_ENDPOINTS.WAREHOUSES.BASE, { params }),

  getById: (id: string) => 
    api.get<WarehouseDto>(API_ENDPOINTS.WAREHOUSES.BY_ID(id)),

  create: (data: CreateWarehouseDto) =>
    api.post<WarehouseDto>(API_ENDPOINTS.WAREHOUSES.BASE, data),

  update: (id: string, data: UpdateWarehouseDto) =>
    api.put<WarehouseDto>(API_ENDPOINTS.WAREHOUSES.BY_ID(id), data),

  delete: (id: string) =>
    api.delete(API_ENDPOINTS.WAREHOUSES.BY_ID(id)),
};

export const warehouseLocationsApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) =>
    api.get<PagedResult<WarehouseLocationDto>>(API_ENDPOINTS.WAREHOUSE_LOCATIONS.BASE, { params }),

  getByWarehouse: (warehouseId: string) =>
    api.get<WarehouseLocationDto[]>(`/api/WarehouseLocations/warehouse/${warehouseId}`),

  getById: (id: string) => 
    api.get<WarehouseLocationDto>(API_ENDPOINTS.WAREHOUSE_LOCATIONS.BY_ID(id)),

  create: (data: CreateWarehouseLocationDto) =>
    api.post<WarehouseLocationDto>(API_ENDPOINTS.WAREHOUSE_LOCATIONS.BASE, data),

  update: (id: string, data: UpdateWarehouseLocationDto) =>
    api.put<WarehouseLocationDto>(API_ENDPOINTS.WAREHOUSE_LOCATIONS.BY_ID(id), data),

  delete: (id: string) =>
    api.delete(API_ENDPOINTS.WAREHOUSE_LOCATIONS.BY_ID(id)),
};
