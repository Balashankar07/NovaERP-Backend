export enum PurchaseOrderStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Sent = 'Sent',
  PartiallyReceived = 'PartiallyReceived',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  Closed = 'Closed'
}

export interface PurchaseOrderItemDto {
  id: string;
  purchaseOrderId: string;
  productId: string;
  purchaseRequestItemId?: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  supplierUnitPrice?: number;
  discount: number;
  tax: number;
  lineTotal: number;
  receivedQuantity: number;
  remarks?: string;
}

export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: PurchaseOrderStatus | string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  remarks?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  items: PurchaseOrderItemDto[];
}

export interface CreatePurchaseOrderItemDto {
  productId: string;
  purchaseRequestItemId?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  remarks?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  expectedDeliveryDate: string;
  currency: string;
  remarks?: string;
  items: CreatePurchaseOrderItemDto[];
}

export interface UpdatePurchaseOrderItemDto {
  id?: string;
  productId: string;
  purchaseRequestItemId?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  remarks?: string;
}

export interface UpdatePurchaseOrderDto {
  supplierId: string;
  expectedDeliveryDate: string;
  currency: string;
  remarks?: string;
  isActive: boolean;
  items: UpdatePurchaseOrderItemDto[];
}
