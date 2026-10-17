import api from "@/lib/axios";

export interface ProcurementAttentionItemDto {
  reference: string;
  type: string;
  priority: string;
  description: string;
  status: string;
  dueDate: string | null;
  referenceId: string;
  actionType: string;
}

export interface ProcurementUpcomingReceiptDto {
  referenceId: string;
  poNumber: string;
  supplierName: string;
  expectedDeliveryDate: string;
  outstandingQuantity: number;
  totalValue: number;
  status: string;
}

export interface ProcurementRecentRequestDto {
  referenceId: string;
  requestNumber: string;
  source: string;
  priority: string;
  status: string;
  requiredByDate: string | null;
  createdAt: string;
}

export interface ProcurementRecentOrderDto {
  referenceId: string;
  poNumber: string;
  supplierName: string;
  status: string;
  expectedDeliveryDate: string;
  totalAmount: number;
  createdAt: string;
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
  needsAttention: ProcurementAttentionItemDto[];
  upcomingReceipts: ProcurementUpcomingReceiptDto[];
  recentRequests: ProcurementRecentRequestDto[];
  recentOrders: ProcurementRecentOrderDto[];
}

export const procurementApi = {
  getSummary: async (): Promise<ProcurementSummaryDto> => {
    const response = await api.get("/Reports/procurement");
    return response.data.data;
  },
};
