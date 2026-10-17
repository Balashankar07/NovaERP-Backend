import { api } from "@/lib/api-helper";
import {
  LogisticsDocumentsOverview,
  PackingList,
  CreatePackingList,
  DeliveryChallan,
  CreateDeliveryChallan,
  ShipmentDocument,
  LogisticsDocumentType,
} from "@/types/logisticsDocuments.types";

export const logisticsDocumentsApi = {
  getOverview: (): Promise<LogisticsDocumentsOverview> => {
    return api.get<LogisticsDocumentsOverview>("/LogisticsDocuments/overview");
  },

  // Packing Lists
  getPackingLists: (shipmentId?: string, salesOrderId?: string): Promise<PackingList[]> => {
    const params = new URLSearchParams();
    if (shipmentId) params.append("shipmentId", shipmentId);
    if (salesOrderId) params.append("salesOrderId", salesOrderId);
    return api.get<PackingList[]>(`/LogisticsDocuments/packing-lists?${params.toString()}`);
  },

  getPackingListById: (id: string): Promise<PackingList> => {
    return api.get<PackingList>(`/LogisticsDocuments/packing-lists/${id}`);
  },

  createPackingList: (dto: CreatePackingList): Promise<PackingList> => {
    return api.post<PackingList>("/LogisticsDocuments/packing-lists", dto);
  },

  updatePackingList: (id: string, dto: CreatePackingList): Promise<PackingList> => {
    return api.put<PackingList>(`/LogisticsDocuments/packing-lists/${id}`, dto);
  },

  issuePackingList: (id: string): Promise<PackingList> => {
    return api.post<PackingList>(`/LogisticsDocuments/packing-lists/${id}/issue`);
  },

  cancelPackingList: (id: string): Promise<PackingList> => {
    return api.post<PackingList>(`/LogisticsDocuments/packing-lists/${id}/cancel`);
  },

  // Delivery Challans
  getDeliveryChallans: (shipmentId?: string, salesOrderId?: string): Promise<DeliveryChallan[]> => {
    const params = new URLSearchParams();
    if (shipmentId) params.append("shipmentId", shipmentId);
    if (salesOrderId) params.append("salesOrderId", salesOrderId);
    return api.get<DeliveryChallan[]>(`/LogisticsDocuments/delivery-challans?${params.toString()}`);
  },

  getDeliveryChallanById: (id: string): Promise<DeliveryChallan> => {
    return api.get<DeliveryChallan>(`/LogisticsDocuments/delivery-challans/${id}`);
  },

  createDeliveryChallan: (dto: CreateDeliveryChallan): Promise<DeliveryChallan> => {
    return api.post<DeliveryChallan>("/LogisticsDocuments/delivery-challans", dto);
  },

  updateDeliveryChallan: (id: string, dto: CreateDeliveryChallan): Promise<DeliveryChallan> => {
    return api.put<DeliveryChallan>(`/LogisticsDocuments/delivery-challans/${id}`, dto);
  },

  issueDeliveryChallan: (id: string): Promise<DeliveryChallan> => {
    return api.post<DeliveryChallan>(`/LogisticsDocuments/delivery-challans/${id}/issue`);
  },

  cancelDeliveryChallan: (id: string): Promise<DeliveryChallan> => {
    return api.post<DeliveryChallan>(`/LogisticsDocuments/delivery-challans/${id}/cancel`);
  },

  // Shipment Documents
  getShipmentDocuments: (
    shipmentId?: string,
    documentType?: LogisticsDocumentType
  ): Promise<ShipmentDocument[]> => {
    const params = new URLSearchParams();
    if (shipmentId) params.append("shipmentId", shipmentId);
    if (documentType) params.append("documentType", documentType);
    return api.get<ShipmentDocument[]>(`/LogisticsDocuments/shipment-documents?${params.toString()}`);
  },
};
