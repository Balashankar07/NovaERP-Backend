export type TrackingMode = 'None' | 'Batch' | 'Serial' | number;
export type LocationType = 'Zone' | 'Rack' | 'Shelf' | 'Bin' | number;
export type BatchStatus = 'Active' | 'Quarantine' | 'Expired' | 'Blocked' | 'Damaged' | number;
export type SerialStatus = 'Available' | 'Reserved' | 'Issued' | 'Damaged' | 'Blocked' | 'Returned' | number;

export interface HierarchicalLocation {
  id: string;
  warehouseId: string;
  warehouseName: string;
  parentLocationId?: string;
  parentLocationName?: string;
  type: LocationType;
  locationCode: string;
  locationName: string;
  zone?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  description?: string;
  isActive: boolean;
  childLocations: HierarchicalLocation[];
}

export interface CreateHierarchicalLocationDto {
  warehouseId: string;
  parentLocationId?: string;
  type: LocationType;
  locationCode: string;
  locationName: string;
  zone?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  description?: string;
}

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocationId?: string;
  locationName?: string;
  manufactureDate?: string;
  expiryDate?: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  status: BatchStatus;
  barcode?: string;
  createdAt: string;
}

export interface CreateInventoryBatchDto {
  batchNumber: string;
  productId: string;
  warehouseId: string;
  warehouseLocationId?: string;
  manufactureDate?: string;
  expiryDate?: string;
  initialQuantity: number;
}

export interface UpdateBatchStatusDto {
  status: BatchStatus;
  remarks?: string;
}

export interface InventorySerialNumber {
  id: string;
  serialNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocationId?: string;
  locationName?: string;
  batchId?: string;
  batchNumber?: string;
  status: SerialStatus;
  receivedAt: string;
  issuedAt?: string;
  currentReferenceType?: string;
  currentReferenceId?: string;
  barcode?: string;
}

export interface RegisterSerialNumbersDto {
  productId: string;
  warehouseId: string;
  warehouseLocationId?: string;
  batchId?: string;
  serialNumbers: string[];
}

export interface UpdateSerialStatusDto {
  status: SerialStatus;
  remarks?: string;
}

export interface UpdateProductTrackingModeDto {
  trackingMode: TrackingMode;
}

export interface TraceabilityNode {
  productId: string;
  productCode: string;
  productName: string;
  trackingMode: TrackingMode;
  batches: InventoryBatch[];
  serials: InventorySerialNumber[];
  movements: TraceabilityMovement[];
}

export interface TraceabilityMovement {
  id: string;
  timestamp: string;
  transactionType: string;
  referenceType: string;
  referenceId?: string;
  warehouseName: string;
  locationName?: string;
  quantity: number;
  balanceAfter: number;
  remarks?: string;
}

export interface TraceabilityReportsSummary {
  totalHierarchicalLocations: number;
  totalActiveBatches: number;
  totalExpiredBatches: number;
  totalBlockedBatches: number;
  totalAvailableSerials: number;
  totalIssuedSerials: number;
  totalDamagedSerials: number;
  stockByLocation: {
    warehouseName: string;
    locationCode: string;
    locationName: string;
    type: string;
    productCount: number;
    totalQuantityOnHand: number;
  }[];
}
