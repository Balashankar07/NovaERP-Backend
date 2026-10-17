export type PackingListStatus = 'Draft' | 'Issued' | 'Cancelled';
export type DeliveryChallanStatus = 'Draft' | 'Issued' | 'Cancelled';
export type LogisticsDocumentType = 'PackingList' | 'DeliveryChallan' | 'CustomerInvoice' | 'ShipmentManifest';

export interface PackingListItem {
  id: string;
  packingListId: string;
  salesOrderItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  serialNumberId?: string;
  serialNumberText?: string;
  quantity: number;
  packageNumber: number;
  description?: string;
}

export interface PackingList {
  id: string;
  packingListNumber: string;
  shipmentId: string;
  trackingNumber: string;
  salesOrderId: string;
  orderNumber: string;
  distributorId: string;
  customerName: string;
  warehouseId?: string;
  warehouseName?: string;
  packingDate: string;
  packedByUserId?: string;
  packedByUserName?: string;
  totalPackages: number;
  totalWeightKg?: number;
  packageDimensions?: string;
  status: PackingListStatus;
  statusText: string;
  notes?: string;
  createdAt: string;
  items: PackingListItem[];
}

export interface CreatePackingListItem {
  salesOrderItemId: string;
  productId: string;
  batchId?: string;
  serialNumberId?: string;
  quantity: number;
  packageNumber: number;
  description?: string;
}

export interface CreatePackingList {
  shipmentId: string;
  totalPackages: number;
  totalWeightKg?: number;
  packageDimensions?: string;
  notes?: string;
  items: CreatePackingListItem[];
}

export interface DeliveryChallanItem {
  id: string;
  deliveryChallanId: string;
  productId: string;
  productCode: string;
  productName: string;
  salesOrderItemId: string;
  batchId?: string;
  batchNumber?: string;
  serialNumberId?: string;
  serialNumberText?: string;
  quantity: number;
  unitOfMeasure: string;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  shipmentId: string;
  trackingNumber: string;
  salesOrderId: string;
  orderNumber: string;
  distributorId: string;
  customerName: string;
  warehouseId?: string;
  warehouseName?: string;
  issueDate: string;
  issuedByUserId?: string;
  issuedByUserName?: string;
  carrier: string;
  vehicleNumber?: string;
  destinationAddress: string;
  status: DeliveryChallanStatus;
  statusText: string;
  remarks?: string;
  createdAt: string;
  items: DeliveryChallanItem[];
}

export interface CreateDeliveryChallanItem {
  productId: string;
  salesOrderItemId: string;
  batchId?: string;
  serialNumberId?: string;
  quantity: number;
  unitOfMeasure: string;
}

export interface CreateDeliveryChallan {
  shipmentId: string;
  carrier: string;
  vehicleNumber?: string;
  destinationAddress: string;
  remarks?: string;
  items: CreateDeliveryChallanItem[];
}

export interface ShipmentDocument {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  documentType: LogisticsDocumentType;
  documentTypeText: string;
  documentNumber: string;
  documentDate: string;
  status: string;
  generatedAt: string;
  generatedByUserId?: string;
  packingListId?: string;
  deliveryChallanId?: string;
  customerInvoiceId?: string;
  invoiceNumber?: string;
  storageReference?: string;
}

export interface LogisticsDocumentsOverview {
  totalPackingLists: number;
  draftPackingLists: number;
  issuedPackingLists: number;
  totalDeliveryChallans: number;
  draftDeliveryChallans: number;
  issuedDeliveryChallans: number;
  totalShipmentDocuments: number;
  linkedInvoicesCount: number;
}
