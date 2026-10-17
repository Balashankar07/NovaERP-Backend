import { api } from '@/lib/api-helper';
import {
  CustomerReturnDto,
  CreateCustomerReturnDto,
  UpdateCustomerReturnDto,
  ReturnAuthorizationDto,
  CreateRmaDto,
  AuthorizeRmaDto,
  ReturnReceiptDto,
  CreateReturnReceiptDto,
  ReturnDispositionDto,
  CreateReturnDispositionDto,
  CustomerRepairRequestDto,
  CreateRepairRequestDto,
  CompleteRepairRequest,
  ReplacementOrderDto,
  CreateReplacementOrderDto,
  ShipReplacementRequest,
  ReverseLogisticsSummaryDto,
  CustomerReturnStatus,
  RmaStatus
} from '../types/returns.types';

export const returnsApi = {
  // Returns
  getAllReturns: (status?: CustomerReturnStatus, customerId?: string): Promise<CustomerReturnDto[]> => {
    const params = new URLSearchParams();
    if (status !== undefined) params.append('status', status.toString());
    if (customerId) params.append('customerId', customerId);
    return api.get<CustomerReturnDto[]>(`/Returns?${params.toString()}`);
  },

  getReturnById: (id: string): Promise<CustomerReturnDto> => {
    return api.get<CustomerReturnDto>(`/Returns/${id}`);
  },

  createReturn: (dto: CreateCustomerReturnDto): Promise<CustomerReturnDto> => {
    return api.post<CustomerReturnDto>('/Returns', dto);
  },

  updateReturn: (id: string, dto: UpdateCustomerReturnDto): Promise<CustomerReturnDto> => {
    return api.put<CustomerReturnDto>(`/Returns/${id}`, dto);
  },

  submitReturn: (id: string): Promise<CustomerReturnDto> => {
    return api.post<CustomerReturnDto>(`/Returns/${id}/submit`);
  },

  approveReturn: (id: string): Promise<CustomerReturnDto> => {
    return api.post<CustomerReturnDto>(`/Returns/${id}/approve`);
  },

  rejectReturn: (id: string, reason: string): Promise<CustomerReturnDto> => {
    return api.post<CustomerReturnDto>(`/Returns/${id}/reject`, { reason });
  },

  cancelReturn: (id: string, reason: string): Promise<CustomerReturnDto> => {
    return api.post<CustomerReturnDto>(`/Returns/${id}/cancel`, { reason });
  },

  closeReturn: (id: string): Promise<CustomerReturnDto> => {
    return api.post<CustomerReturnDto>(`/Returns/${id}/close`);
  },

  // RMA
  getAllRmas: (status?: RmaStatus, returnId?: string): Promise<ReturnAuthorizationDto[]> => {
    const params = new URLSearchParams();
    if (status !== undefined) params.append('status', status.toString());
    if (returnId) params.append('returnId', returnId);
    return api.get<ReturnAuthorizationDto[]>(`/Returns/rmas?${params.toString()}`);
  },

  getRmaById: (id: string): Promise<ReturnAuthorizationDto> => {
    return api.get<ReturnAuthorizationDto>(`/Returns/rmas/${id}`);
  },

  createRma: (dto: CreateRmaDto): Promise<ReturnAuthorizationDto> => {
    return api.post<ReturnAuthorizationDto>('/Returns/rmas', dto);
  },

  authorizeRma: (id: string, dto: AuthorizeRmaDto): Promise<ReturnAuthorizationDto> => {
    return api.post<ReturnAuthorizationDto>(`/Returns/rmas/${id}/authorize`, dto);
  },

  // Receipts
  getAllReceipts: (warehouseId?: string, returnId?: string): Promise<ReturnReceiptDto[]> => {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouseId', warehouseId);
    if (returnId) params.append('returnId', returnId);
    return api.get<ReturnReceiptDto[]>(`/Returns/receipts?${params.toString()}`);
  },

  getReceiptById: (id: string): Promise<ReturnReceiptDto> => {
    return api.get<ReturnReceiptDto>(`/Returns/receipts/${id}`);
  },

  receiveReturn: (dto: CreateReturnReceiptDto): Promise<ReturnReceiptDto> => {
    return api.post<ReturnReceiptDto>('/Returns/receipts', dto);
  },

  // Dispositions
  getAllDispositions: (returnId?: string): Promise<ReturnDispositionDto[]> => {
    const params = new URLSearchParams();
    if (returnId) params.append('returnId', returnId);
    return api.get<ReturnDispositionDto[]>(`/Returns/dispositions?${params.toString()}`);
  },

  getDispositionById: (id: string): Promise<ReturnDispositionDto> => {
    return api.get<ReturnDispositionDto>(`/Returns/dispositions/${id}`);
  },

  createDisposition: (dto: CreateReturnDispositionDto): Promise<ReturnDispositionDto> => {
    return api.post<ReturnDispositionDto>('/Returns/dispositions', dto);
  },

  executeDisposition: (id: string): Promise<ReturnDispositionDto> => {
    return api.post<ReturnDispositionDto>(`/Returns/dispositions/${id}/execute`);
  },

  // Repairs
  getAllRepairs: (returnId?: string): Promise<CustomerRepairRequestDto[]> => {
    const params = new URLSearchParams();
    if (returnId) params.append('returnId', returnId);
    return api.get<CustomerRepairRequestDto[]>(`/Returns/repairs?${params.toString()}`);
  },

  getRepairById: (id: string): Promise<CustomerRepairRequestDto> => {
    return api.get<CustomerRepairRequestDto>(`/Returns/repairs/${id}`);
  },

  createRepair: (dto: CreateRepairRequestDto): Promise<CustomerRepairRequestDto> => {
    return api.post<CustomerRepairRequestDto>('/Returns/repairs', dto);
  },

  approveRepair: (id: string): Promise<CustomerRepairRequestDto> => {
    return api.post<CustomerRepairRequestDto>(`/Returns/repairs/${id}/approve`);
  },

  startRepair: (id: string): Promise<CustomerRepairRequestDto> => {
    return api.post<CustomerRepairRequestDto>(`/Returns/repairs/${id}/start`);
  },

  completeRepair: (id: string, dto: CompleteRepairRequest): Promise<CustomerRepairRequestDto> => {
    return api.post<CustomerRepairRequestDto>(`/Returns/repairs/${id}/complete`, dto);
  },

  // Replacements
  getAllReplacements: (returnId?: string): Promise<ReplacementOrderDto[]> => {
    const params = new URLSearchParams();
    if (returnId) params.append('returnId', returnId);
    return api.get<ReplacementOrderDto[]>(`/Returns/replacements?${params.toString()}`);
  },

  getReplacementById: (id: string): Promise<ReplacementOrderDto> => {
    return api.get<ReplacementOrderDto>(`/Returns/replacements/${id}`);
  },

  createReplacement: (dto: CreateReplacementOrderDto): Promise<ReplacementOrderDto> => {
    return api.post<ReplacementOrderDto>('/Returns/replacements', dto);
  },

  reserveReplacementStock: (id: string): Promise<ReplacementOrderDto> => {
    return api.post<ReplacementOrderDto>(`/Returns/replacements/${id}/reserve-stock`);
  },

  shipReplacement: (id: string, dto: ShipReplacementRequest): Promise<ReplacementOrderDto> => {
    return api.post<ReplacementOrderDto>(`/Returns/replacements/${id}/ship`, dto);
  },

  // Reports
  getSummary: (): Promise<ReverseLogisticsSummaryDto> => {
    return api.get<ReverseLogisticsSummaryDto>('/Returns/reports/summary');
  }
};
