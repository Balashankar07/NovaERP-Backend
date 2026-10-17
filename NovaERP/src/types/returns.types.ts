export enum CustomerReturnStatus {
  Draft = 0,
  Submitted = 1,
  Approved = 2,
  Rejected = 3,
  Received = 4,
  Inspected = 5,
  Dispositioned = 6,
  Closed = 7,
  Cancelled = 8
}

export enum RmaStatus {
  Submitted = 0,
  Approved = 1,
  Rejected = 2
}

export enum ReturnItemCondition {
  Unopened = 0,
  OpenedDefective = 1,
  OpenedDamaged = 2,
  UsedNormal = 3,
  Destroyed = 4
}

export enum ReturnDispositionType {
  Repair = 0,
  Replacement = 1,
  Restock = 2,
  Scrap = 3,
  RejectReturn = 4,
  Hold = 5
}

export enum ReturnDispositionStatus {
  Pending = 0,
  Approved = 1,
  Executed = 2,
  Rejected = 3
}

export enum ReturnRepairStatus {
  Requested = 0,
  Approved = 1,
  InRepair = 2,
  Repaired = 3,
  Failed = 4,
  Cancelled = 5
}

export enum ReplacementStatus {
  Pending = 0,
  Reserved = 1,
  Shipped = 2,
  Delivered = 3,
  Cancelled = 4
}

export interface CustomerReturnItemDto {
  id: string;
  customerReturnId: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  serialNumber?: string;
  batchNumber?: string;
  reason: string;
  condition: ReturnItemCondition;
  conditionName: string;
}

export interface ReturnAuthorizationDto {
  id: string;
  rmaNumber: string;
  customerReturnId: string;
  returnNumber: string;
  authorizedByUserId?: string;
  authorizedByName?: string;
  authorizationDate: string;
  status: RmaStatus;
  statusName: string;
  reason?: string;
  instructions?: string;
}

export interface ReturnReceiptDto {
  id: string;
  receiptNumber: string;
  customerReturnId: string;
  returnNumber: string;
  returnAuthorizationId?: string;
  rmaNumber?: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocationId?: string;
  locationName?: string;
  productId: string;
  productCode: string;
  productName: string;
  receivedByUserId?: string;
  receivedByName?: string;
  receivedDate: string;
  quantity: number;
  serialNumber?: string;
  batchNumber?: string;
  condition: ReturnItemCondition;
  conditionName: string;
  notes?: string;
  qualityInspectionId?: string;
  inspectionStatus?: string;
}

export interface ReturnDispositionDto {
  id: string;
  dispositionNumber: string;
  customerReturnId: string;
  returnNumber: string;
  returnReceiptId: string;
  receiptNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  dispositionType: ReturnDispositionType;
  dispositionTypeName: string;
  status: ReturnDispositionStatus;
  statusName: string;
  reason: string;
  approvedByUserId?: string;
  approvedByName?: string;
  approvedDate?: string;
  executedDate?: string;
  notes?: string;
}

export interface CustomerRepairRequestDto {
  id: string;
  repairNumber: string;
  customerReturnId: string;
  returnNumber: string;
  returnAuthorizationId?: string;
  rmaNumber?: string;
  productId: string;
  productCode: string;
  productName: string;
  serialNumber?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  workCenterId?: string;
  workCenterName?: string;
  faultDescription: string;
  repairAction?: string;
  status: ReturnRepairStatus;
  statusName: string;
  startDate?: string;
  completionDate?: string;
  reinspectionId?: string;
  reinspectionStatus?: string;
  notes?: string;
}

export interface ReplacementOrderDto {
  id: string;
  replacementNumber: string;
  customerReturnId: string;
  returnNumber: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  warehouseId: string;
  warehouseName: string;
  status: ReplacementStatus;
  statusName: string;
  reservationId?: string;
  shipmentId?: string;
  shipmentTrackingNumber?: string;
  notes?: string;
}

export interface CustomerReturnDto {
  id: string;
  returnNumber: string;
  customerId: string;
  customerName: string;
  salesOrderId: string;
  salesOrderNumber: string;
  shipmentId?: string;
  shipmentTrackingNumber?: string;
  warrantyClaimId?: string;
  reason: string;
  requestedDate: string;
  status: CustomerReturnStatus;
  statusName: string;
  notes?: string;
  createdByUserId?: string;
  createdByName?: string;
  createdAt: string;

  items: CustomerReturnItemDto[];
  rma?: ReturnAuthorizationDto;
  receipts: ReturnReceiptDto[];
  dispositions: ReturnDispositionDto[];
  repairs: CustomerRepairRequestDto[];
  replacements: ReplacementOrderDto[];
}

export interface CreateCustomerReturnItemDto {
  productId: string;
  quantity: number;
  serialNumber?: string;
  batchNumber?: string;
  reason: string;
  condition: ReturnItemCondition;
}

export interface CreateCustomerReturnDto {
  customerId: string;
  salesOrderId: string;
  shipmentId?: string;
  warrantyClaimId?: string;
  reason: string;
  notes?: string;
  items: CreateCustomerReturnItemDto[];
}

export interface UpdateCustomerReturnDto {
  reason: string;
  notes?: string;
}

export interface CreateRmaDto {
  customerReturnId: string;
  instructions?: string;
}

export interface AuthorizeRmaDto {
  approve: boolean;
  reason?: string;
  instructions?: string;
}

export interface CreateReturnReceiptDto {
  customerReturnId: string;
  returnAuthorizationId?: string;
  warehouseId: string;
  warehouseLocationId?: string;
  productId: string;
  quantity: number;
  serialNumber?: string;
  batchNumber?: string;
  condition: ReturnItemCondition;
  notes?: string;
  triggerQualityInspection: boolean;
}

export interface CreateReturnDispositionDto {
  customerReturnId: string;
  returnReceiptId: string;
  productId: string;
  quantity: number;
  dispositionType: ReturnDispositionType;
  reason: string;
  notes?: string;
}

export interface CreateRepairRequestDto {
  customerReturnId: string;
  returnAuthorizationId?: string;
  productId: string;
  serialNumber?: string;
  assignedEmployeeId?: string;
  workCenterId?: string;
  faultDescription: string;
  notes?: string;
}

export interface CompleteRepairRequest {
  repairAction: string;
  reinspectionPassed: boolean;
}

export interface CreateReplacementOrderDto {
  customerReturnId: string;
  productId: string;
  quantity: number;
  warehouseId: string;
  notes?: string;
}

export interface ShipReplacementRequest {
  courierName: string;
  trackingNumber: string;
}

export interface ReverseLogisticsSummaryDto {
  totalReturns: number;
  pendingRmas: number;
  approvedRmas: number;
  totalReceipts: number;
  inRepairs: number;
  completedRepairs: number;
  replacementsIssued: number;
  restockedQuantity: number;
  scrappedQuantity: number;

  statusBreakdown: Record<string, number>;
  dispositionBreakdown: Record<string, number>;
  reasonBreakdown: Record<string, number>;
}
