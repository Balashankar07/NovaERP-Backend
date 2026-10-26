export enum GoodsReceiptStatus {
  Draft = "Draft",
  Completed = "Completed",
  Cancelled = "Cancelled"
}

export interface GoodsReceiptItemDto {
  id: string;
  goodsReceiptId: string;
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  productCode: string;
  orderedQuantity: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  remarks?: string;
  qualityInspectionId?: string;
  qualityInspectionStatus?: string;
  inspectedQuantity?: number;
  passedQuantity?: number;
  failedQuantity?: number;
}

export interface GoodsReceiptDto {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  receiptDate: string;
  status: GoodsReceiptStatus;
  remarks?: string;
  receivedBy?: string;
  warehouseId?: string;
  warehouseLocationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  items: GoodsReceiptItemDto[];
}

export interface CreateGoodsReceiptItemDto {
  purchaseOrderItemId: string;
  receivedQuantity: number;
  rejectedQuantity: number;
  remarks?: string;
}

export interface CreateGoodsReceiptDto {
  purchaseOrderId: string;
  warehouseId: string;
  warehouseLocationId?: string;
  remarks?: string;
  items: CreateGoodsReceiptItemDto[];
}

export interface UpdateGoodsReceiptItemDto {
  id?: string;
  purchaseOrderItemId: string;
  receivedQuantity: number;
  rejectedQuantity: number;
  remarks?: string;
}

export interface UpdateGoodsReceiptDto {
  warehouseId?: string;
  warehouseLocationId?: string;
  remarks?: string;
  items?: UpdateGoodsReceiptItemDto[];
}
