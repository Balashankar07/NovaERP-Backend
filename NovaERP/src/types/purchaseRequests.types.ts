export enum PurchaseRequestPriority {
  Low = 1,
  Normal = 2,
  High = 3,
  Urgent = 4,
}

export enum PurchaseRequestStatus {
  Draft = 1,
  PendingApproval = 2,
  Approved = 3,
  Rejected = 4,
  Cancelled = 5,
  PartiallyConverted = 6,
  FullyConverted = 7,
}

export enum PurchaseRequestSource {
  Manual = 1,
  ProductionShortage = 2,
  InventoryReorder = 3,
}

export interface PurchaseRequestItemDto {
  id: string;
  purchaseRequestId: string;
  productId: string;
  productCode: string;
  productNumber: string;
  productName: string;
  requestedQuantity: number;
  approvedQuantity: number;
  convertedQuantity: number;
  remainingQuantity: number;
  remarks?: string;
}

export interface PurchaseRequestDto {
  id: string;
  requestNumber: string;
  requestedBy: string;
  department: string;
  requestDate: string;
  requiredByDate: string;
  priority: PurchaseRequestPriority;
  reason: string;
  status: PurchaseRequestStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  source: PurchaseRequestSource;
  sourceReferenceId?: string;
  createdAt: string;
  updatedAt?: string;
  items: PurchaseRequestItemDto[];
}

export interface CreatePurchaseRequestItemDto {
  productId: string;
  requestedQuantity: number;
  remarks?: string;
}

export interface CreatePurchaseRequestDto {
  requiredByDate: string;
  priority: PurchaseRequestPriority;
  reason: string;
  source: PurchaseRequestSource;
  sourceReferenceId?: string;
  items: CreatePurchaseRequestItemDto[];
}

export interface UpdatePurchaseRequestDto {
  requiredByDate: string;
  priority: PurchaseRequestPriority;
  reason: string;
  items: CreatePurchaseRequestItemDto[];
}
