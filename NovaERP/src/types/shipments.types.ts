export enum ShipmentStatus {
  Pending = "Pending",
  Dispatched = "Dispatched",
  Delivered = "Delivered",
  Cancelled = "Cancelled",
}

export interface ShipmentItemDto {
  id: string;
  shipmentId: string;
  productId: string;
  productName?: string;
  productCode?: string;
  quantity: number;
  deliveredQuantity: number;
}

export interface ShipmentDto {
  id: string;
  salesOrderId: string;
  trackingNumber: string;
  courierName: string;
  dispatchDate: string | null;
  deliveryDate: string | null;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string | null;
  orderNumber?: string;
  customerName?: string;
  shippingAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  shipmentItems: ShipmentItemDto[];
}

export interface CreateShipmentItemDto {
  productId: string;
  quantity: number;
}

export interface CreateShipmentDto {
  salesOrderId: string;
  trackingNumber: string;
  courierName: string;
  shipmentItems: CreateShipmentItemDto[];
}

export interface DeliverShipmentItemDto {
  shipmentItemId: string;
  deliveredQuantity: number;
}

export interface DeliverShipmentDto {
  deliveredItems: DeliverShipmentItemDto[];
}

export interface ReadyToShipQueueItemDto {
  salesOrderId: string;
  salesOrderNumber: string;
  distributorName: string;
  orderDate: string;
  requiredDeliveryDate?: string;
  status: string;
  orderedQuantity: number;
  reservedQuantity: number;
  shippedQuantity: number;
  remainingQuantity: number;
  warehouseName: string;
  totalAmount: number;
}

export interface DistributionInventoryVisibilityDto {
  productId: string;
  productName: string;
  sku: string;
  warehouseName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  isLowStock: boolean;
}

export interface DistributionAttentionItemDto {
  id: string;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  type: string;
  linkUrl: string;
}

export interface RecentDispatchActivityDto {
  shipmentId: string;
  shipmentNumber: string;
  salesOrderNumber: string;
  distributorName: string;
  courierName: string;
  totalQuantity: number;
  dispatchDate?: string;
  status: string;
}

export interface DistributionSummaryDto {
  readyToShipOrders: number;
  draftShipments: number;
  shipmentsReadyForDispatch: number;
  partiallyShippedOrders: number;
  dispatchedShipments: number;
  completedOrders: number;
  unitsAwaitingDispatch: number;
  totalShipmentFulfillmentValue: number;
  shipmentPipeline: Record<string, number>;
  readyToShipQueue: ReadyToShipQueueItemDto[];
  inventoryVisibility: DistributionInventoryVisibilityDto[];
  attentionItems: DistributionAttentionItemDto[];
  recentDispatches: RecentDispatchActivityDto[];
}

