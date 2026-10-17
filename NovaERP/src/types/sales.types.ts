export enum SalesOrderStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Reserved = 'Reserved',
  ReadyToShip = 'ReadyToShip',
  PartiallyShipped = 'PartiallyShipped',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export interface SalesOrderItemDto {
  id: string;
  salesOrderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  tax: number;
  totalPrice: number;
  reservedQuantity: number;
  shippedQuantity: number;
}

export interface SalesOrderDto {
  id: string;
  orderNumber: string;
  distributorId: string;
  distributorName: string;
  orderDate: string;
  requiredDeliveryDate?: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddress?: string;
  billingAddress?: string;
  remarks?: string;
  status: SalesOrderStatus;
  items: SalesOrderItemDto[];
}

export interface CreateSalesOrderItemDto {
  productId: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface CreateSalesOrderDto {
  distributorId: string;
  requiredDeliveryDate?: string;
  currency?: string;
  shippingAddress?: string;
  billingAddress?: string;
  remarks?: string;
  items: CreateSalesOrderItemDto[];
}

export interface UpdateSalesOrderDto extends CreateSalesOrderDto {
}

export interface FinishedGoodsAvailabilityDto {
  productId: string;
  productName: string;
  sku: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  unitPrice: number;
}

export interface ActiveReservationDto {
  reservationId: string;
  salesOrderId: string;
  salesOrderNumber: string;
  distributorName: string;
  productName: string;
  quantityReserved: number;
  quantityConsumed: number;
  reservedAt: string;
  status: string;
}

export interface ReadyToShipOrderDto {
  orderId: string;
  orderNumber: string;
  distributorName: string;
  productName: string;
  orderedQuantity: number;
  reservedQuantity: number;
  shippedQuantity: number;
  remainingQuantity: number;
  status: string;
  orderDate: string;
}

export interface DistributorActivityDto {
  distributorId: string;
  companyName: string;
  totalOrders: number;
  totalOrderValue: number;
  contactPerson: string;
}

export interface SalesAttentionItemDto {
  id: string;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  type: string;
  linkUrl: string;
}

export interface RecentSalesActivityDto {
  id: string;
  orderNumber: string;
  action: string;
  distributorName: string;
  totalAmount: number;
  status: string;
  timestamp: string;
}

export interface SalesSummaryDto {
  draftOrders: number;
  pendingApprovalOrders: number;
  approvedOrders: number;
  reservedOrders: number;
  readyToShipOrders: number;
  partiallyShippedOrders: number;
  completedOrders: number;
  totalOrders: number;
  totalSalesValue: number;
  reservedFinishedGoodsValue: number;
  availableFinishedGoodsCount: number;
  availableFinishedGoodsQuantity: number;
  finishedGoodsAvailability: FinishedGoodsAvailabilityDto[];
  activeReservations: ActiveReservationDto[];
  readyToShipQueue: ReadyToShipOrderDto[];
  topDistributors: DistributorActivityDto[];
  attentionItems: SalesAttentionItemDto[];
  recentActivity: RecentSalesActivityDto[];
}

