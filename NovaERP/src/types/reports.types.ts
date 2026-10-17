export interface DashboardSummaryDto {
  totalProducts: number;
  totalSuppliers: number;
  totalWarehouses: number;
  totalInventoryValue: number;
  openPurchaseOrders: number;
  completedProductionOrders: number;
  pendingQualityInspections: number;
  salesThisMonth: number;
  shipmentsPending: number;
  activeWarranties: number;
  openWarrantyClaims: number;
  monthlyProduction: ProductionChartDto[];
}

export interface ProductionChartDto {
  name: string;
  units: number;
}

export interface AuditReportDto {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  ipAddress: string;
  timestamp: string;
  userName?: string;
}

export interface InventoryReportDto {
  productId: string;
  productName: string;
  productCode: string;
  quantityOnHand: number;
  minStockLevel: number;
  maxStockLevel: number;
  costPrice: number;
  totalValue: number;
  lastRestockDate: string;
}

export interface ProductionReportDto {
  orderId: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface SalesReportDto {
  orderId: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  status: string;
}

export interface WarrantyReportDto {
  warrantyId: string;
  serialNumber: string;
  productName: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ProcurementSummaryDto {
  pendingPurchaseRequests: number;
  approvedPurchaseRequests: number;
  openPurchaseOrders: number;
  pendingReceipts: number;
  overdueReceipts: number;
  partiallyReceivedOrders: number;
  activeSuppliersCount: number;
  supplierIssuesCount: number;
  totalProcurementValue: number;
  prPipeline: Record<string, number>;
  poPipeline: Record<string, number>;
  needsAttention: any[];
  upcomingReceipts: any[];
  recentRequests: any[];
  recentOrders: any[];
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

export interface WarrantySummaryDto {
  activeWarranties: number;
  expiringWarranties: number;
  activeClaims: number;
  pendingClaims: number;
  underReviewClaims: number;
  approvedClaims: number;
  resolvedClaims: number;
  rejectedClaims: number;
  closedClaims: number;
  totalClaims: number;
  averageResolutionDays: number;
  claimPipeline: Record<string, number>;
  expiringQueue: ExpiringWarrantyQueueItemDto[];
  claimQueue: WarrantyClaimQueueItemDto[];
  coverageOverview: WarrantyCoverageItemDto[];
  attentionItems: WarrantyAttentionItemDto[];
  recentActivity: WarrantyRecentActivityDto[];
}

export interface ExpiringWarrantyQueueItemDto {
  warrantyId: string;
  serialNumber: string;
  warrantyType: string;
  productId: string;
  productName: string;
  productSku: string;
  shipmentId: string;
  shipmentNumber: string;
  salesOrderNumber: string;
  distributorName: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  activeClaimCount: number;
  status: string;
}

export interface WarrantyClaimQueueItemDto {
  claimId: string;
  warrantyId: string;
  serialNumber: string;
  productName: string;
  productSku: string;
  distributorName: string;
  salesOrderNumber: string;
  shipmentNumber: string;
  requestDate: string;
  complaint: string;
  resolution?: string;
  status: string;
  warrantyType: string;
  warrantyEndDate: string;
}

export interface WarrantyCoverageItemDto {
  warrantyId: string;
  serialNumber: string;
  warrantyType: string;
  productId: string;
  productName: string;
  productSku: string;
  distributorName: string;
  salesOrderNumber: string;
  shipmentNumber: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: string;
  totalClaims: number;
}

export interface WarrantyAttentionItemDto {
  id: string;
  title: string;
  message: string;
  severity: "high" | "medium" | "low";
  type: string;
  linkUrl: string;
}

export interface WarrantyRecentActivityDto {
  claimId: string;
  warrantyId: string;
  serialNumber: string;
  productName: string;
  distributorName: string;
  complaint: string;
  resolution?: string;
  status: string;
  activityDate: string;
}
