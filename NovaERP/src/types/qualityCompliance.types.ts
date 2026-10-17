export type NcrSeverity = 'Minor' | 'Major' | 'Critical';
export type NcrStatus = 'Open' | 'UnderInvestigation' | 'DispositionPending' | 'ActionPending' | 'VerificationPending' | 'Closed' | 'Cancelled';

export type CapaType = 'Corrective' | 'Preventive' | 'CorrectiveAndPreventive';
export type CapaStatus = 'Draft' | 'Open' | 'InProgress' | 'PendingVerification' | 'Effective' | 'Ineffective' | 'Closed' | 'Cancelled';

export type QualityDispositionType = 'Rework' | 'Scrap' | 'UseAsIs' | 'Hold';
export type DispositionStatus = 'Pending' | 'Approved' | 'Rejected';

export type ReworkStatus = 'Requested' | 'Approved' | 'InProgress' | 'Completed' | 'Rejected' | 'Cancelled';
export type ScrapStatus = 'Pending' | 'Approved' | 'Rejected';

export interface NonConformanceReport {
    id: string;
    ncrNumber: string;
    qualityInspectionId: string;
    qualityInspectionNumber: string;
    productionExecutionId?: string;
    productionExecutionNumber?: string;
    productId: string;
    productCode: string;
    productName: string;
    batchId?: string;
    batchNumber?: string;
    serialNumberId?: string;
    serialNumber?: string;
    reportedByUserId: string;
    reportedByUserName: string;
    assignedToUserId?: string;
    assignedToUserName?: string;
    severity: NcrSeverity | string;
    category: string;
    description: string;
    detectedDate: string;
    status: NcrStatus | string;
    containmentAction?: string;
    rootCauseCategory?: string;
    rootCauseDescription?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    closedDate?: string;
    closureRemarks?: string;
    createdAt: string;
}

export interface CreateNcrDto {
    qualityInspectionId: string;
    productionExecutionId?: string;
    productId: string;
    batchId?: string;
    serialNumberId?: string;
    assignedToUserId?: string;
    severity: NcrSeverity;
    category: string;
    description: string;
    containmentAction?: string;
}

export interface UpdateNcrDto {
    severity: NcrSeverity;
    category: string;
    description: string;
    containmentAction?: string;
    rootCauseCategory?: string;
    rootCauseDescription?: string;
    correctiveAction?: string;
    preventiveAction?: string;
}

export interface Capa {
    id: string;
    capaNumber: string;
    ncrId: string;
    ncrNumber: string;
    type: CapaType | string;
    title: string;
    description: string;
    rootCause?: string;
    containmentAction?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    ownerEmployeeId: string;
    ownerEmployeeName: string;
    targetDate?: string;
    completedDate?: string;
    verificationNotes?: string;
    status: CapaStatus | string;
    createdAt: string;
}

export interface CreateCapaDto {
    ncrId: string;
    type: CapaType;
    title: string;
    description: string;
    rootCause?: string;
    containmentAction?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    ownerEmployeeId: string;
    targetDate?: string;
}

export interface UpdateCapaDto {
    type: CapaType;
    title: string;
    description: string;
    rootCause?: string;
    containmentAction?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    ownerEmployeeId: string;
    targetDate?: string;
    status: CapaStatus;
}

export interface QualityDisposition {
    id: string;
    dispositionNumber: string;
    qualityInspectionId: string;
    qualityInspectionNumber: string;
    ncrId?: string;
    ncrNumber?: string;
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    warehouseId: string;
    warehouseName: string;
    warehouseLocationId?: string;
    locationName?: string;
    batchId?: string;
    batchNumber?: string;
    serialNumberId?: string;
    serialNumber?: string;
    dispositionType: QualityDispositionType | string;
    reason: string;
    approvedByUserId?: string;
    approvedByUserName?: string;
    approvedDate?: string;
    status: DispositionStatus | string;
    createdAt: string;
}

export interface CreateQualityDispositionDto {
    qualityInspectionId: string;
    ncrId?: string;
    productId: string;
    quantity: number;
    warehouseId: string;
    warehouseLocationId?: string;
    batchId?: string;
    serialNumberId?: string;
    dispositionType: QualityDispositionType;
    reason: string;
}

export interface ReworkRequest {
    id: string;
    reworkNumber: string;
    qualityInspectionId: string;
    qualityInspectionNumber: string;
    ncrId?: string;
    ncrNumber?: string;
    productionExecutionId?: string;
    productionExecutionNumber?: string;
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    reason: string;
    assignedWorkCenterId?: string;
    workCenterName?: string;
    assignedEmployeeId?: string;
    assignedEmployeeName?: string;
    status: ReworkStatus | string;
    startDate?: string;
    completionDate?: string;
    remarks?: string;
    approvedByUserId?: string;
    approvedByUserName?: string;
    createdAt: string;
}

export interface CreateReworkRequestDto {
    qualityInspectionId: string;
    ncrId?: string;
    productionExecutionId?: string;
    productId: string;
    quantity: number;
    reason: string;
    assignedWorkCenterId?: string;
    assignedEmployeeId?: string;
}

export interface ScrapRecord {
    id: string;
    scrapNumber: string;
    qualityInspectionId: string;
    qualityInspectionNumber: string;
    ncrId?: string;
    ncrNumber?: string;
    productId: string;
    productCode: string;
    productName: string;
    batchId?: string;
    batchNumber?: string;
    serialNumberId?: string;
    serialNumber?: string;
    warehouseId: string;
    warehouseName: string;
    warehouseLocationId?: string;
    locationName?: string;
    quantity: number;
    reason: string;
    approvedByUserId?: string;
    approvedByUserName?: string;
    scrapDate?: string;
    status: ScrapStatus | string;
    remarks?: string;
    createdAt: string;
}

export interface CreateScrapRecordDto {
    qualityInspectionId: string;
    ncrId?: string;
    productId: string;
    batchId?: string;
    serialNumberId?: string;
    warehouseId: string;
    warehouseLocationId?: string;
    quantity: number;
    reason: string;
}

export interface QualityComplianceSummary {
    totalNcrs: number;
    openNcrs: number;
    closedNcrs: number;
    ncrsBySeverity: Record<string, number>;
    totalCapas: number;
    openCapas: number;
    closedCapas: number;
    overdueCapas: number;
    totalDispositions: number;
    dispositionsByType: Record<string, number>;
    totalReworkRequests: number;
    completedReworkQuantity: number;
    totalScrapRecords: number;
    totalScrapQuantity: number;
    defectCategorySummary: Record<string, number>;
}
