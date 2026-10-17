

// Matches NovaERP.Domain.Enums.ProductionPlanStatus exactly
export enum ProductionPlanStatus {
  Draft = 1,
  Released = 2,
  Completed = 3,
  Cancelled = 4,
}

// Matches NovaERP.Domain.Enums.ProductionOrderStatus exactly
export enum ProductionOrderStatus {
  Draft = 0,
  Released = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum ProductionOrderPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export interface ProductionPlanDto {
  id: string;
  planNumber: string;
  productId: string;
  productName: string;
  plannedQuantity: number;
  completedQuantity: number;
  plannedStartDate: string;
  plannedEndDate: string;
  status: string | number; // Backend: Draft=1, Released=2, Completed=3, Cancelled=4
  priority: number;
  notes?: string;
  createdAt: string;
}

export interface CreateProductionPlanDto {
  productId: string;
  bomId: string;
  plannedQuantity: number;
  plannedStartDate: string;
  plannedEndDate: string;
  priority: number;
  remarks?: string;
}

export interface UpdateProductionPlanDto extends CreateProductionPlanDto { }

export interface MaterialRequirementDto {
  componentId: string;
  componentCode: string;
  componentName: string;
  requiredQuantity: number;
  availableQuantity: number;
  unit: string;
  isAvailable: boolean;
}

export interface ShortageDto {
  componentId: string;
  componentName: string;
  required: number;
  available: number;
  shortage: number;
}

// ==========================================
// PRODUCTION ORDERS
// ==========================================

export interface ProductionOrderDto {
  id: string;
  productionOrderNumber: string;
  productionPlanId: string;
  productId: string;
  productName?: string; // Sometimes populated by backend for UI
  
  plannedQuantity: number;
  startedQuantity: number;
  completedQuantity: number;
  rejectedQuantity: number;
  
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  
  workCenter?: string;
  supervisor?: string;
  
  priority: ProductionOrderPriority;
  status: ProductionOrderStatus | string | number;
  
  remarks?: string;
  
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateProductionOrderDto {
  productionPlanId: string;
  plannedQuantity: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  workCenter?: string;
  supervisor?: string;
  priority: number;
  remarks?: string;
}

export interface UpdateProductionOrderDto {
  plannedQuantity: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  workCenter?: string;
  supervisor?: string;
  priority: number;
  remarks?: string;
}

export interface StartProductionOrderRequest {
  startedQuantity: number;
}

export interface CompleteProductionOrderRequest {
  completedQuantity: number;
  rejectedQuantity: number;
}

export interface CancelProductionOrderRequest {
  reason: string;
}

// ==========================================
// PRODUCTION EXECUTIONS
// ==========================================

export enum ProductionExecutionStatus {
  Draft = 0,
  Started = 1,
  Completed = 2,
  Cancelled = 3,
}

export interface MaterialConsumptionDto {
  id: string;
  productionExecutionId: string;
  productId: string;
  inventoryId: string;
  requiredQuantity: number;
  consumedQuantity: number;
  varianceQuantity: number;
  createdAt: string;
}

export interface ProductionExecutionDto {
  id: string;
  executionNumber: string;
  productionOrderId: string;
  startedAt?: string;
  completedAt?: string;
  producedQuantity: number;
  rejectedQuantity: number;
  status: ProductionExecutionStatus | string | number;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateProductionExecutionDto {
  productionOrderId: string;
  remarks?: string;
}

export interface UpdateProductionExecutionDto {
  remarks?: string;
}

export interface CompleteProductionExecutionDto {
  producedQuantity: number;
  rejectedQuantity: number;
  outputWarehouseId: string;
  outputWarehouseLocationId?: string;
}

export interface ProductionMaterialReadinessDto {
  productionOrderId: string;
  productionOrderNumber: string;
  productId: string;
  productName: string;
  plannedQuantity: number;
  bomName: string;
  requiredComponentQuantity: number;
  availableComponentQuantity: number;
  shortageQuantity: number;
  readinessState: string; // READY, PARTIALLY AVAILABLE, INSUFFICIENT
}

export interface ProductionAwaitingQualityDto {
  executionId: string;
  executionNumber: string;
  productionOrderNumber: string;
  productId: string;
  productName: string;
  producedQuantity: number;
  inspectionStatus: string;
  completedDate?: string;
  inspectionId?: string;
}

export interface ProductionAttentionItemDto {
  id: string;
  title: string;
  message: string;
  severity: "high" | "medium" | "low" | string;
  type: string;
  linkUrl: string;
  targetId?: string;
}

export interface RecentProductionOrderDto {
  id: string;
  orderNumber: string;
  productName: string;
  plannedQuantity: number;
  status: string;
  createdAt: string;
}

export interface RecentProductionExecutionDto {
  id: string;
  executionNumber: string;
  orderNumber: string;
  productName: string;
  producedQuantity: number;
  wastePercentage: number;
  status: string;
  createdAt: string;
}

export interface ProductionSummaryDto {
  totalProductionPlans: number;
  activeProductionOrders: number;
  pendingExecutions: number;
  materialShortagesCount: number;
  ordersInProgress: number;
  awaitingQualityCount: number;
  completedExecutionsCount: number;
  totalProducedQuantity: number;
  totalPlannedQuantity: number;
  totalWasteQuantity: number;
  averageWastePercentage: number;
  
  planStatusCounts: Record<string, number>;
  orderStatusCounts: Record<string, number>;
  
  materialReadiness: ProductionMaterialReadinessDto[];
  awaitingQualityInspections: ProductionAwaitingQualityDto[];
  attentionItems: ProductionAttentionItemDto[];
  recentOrders: RecentProductionOrderDto[];
  recentExecutions: RecentProductionExecutionDto[];
}

