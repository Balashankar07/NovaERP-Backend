export type QualityInspectionStatus = 'Draft' | 'InProgress' | 'Passed' | 'PartiallyPassed' | 'Failed' | 'Cancelled';

export interface QualityDefect {
    id: string;
    qualityInspectionId: string;
    defectCode: string;
    defectName: string;
    quantity: number;
    severity: string;
    remarks?: string;
}

export interface QualityInspection {
    id: string;
    inspectionNumber: string;
    productionExecutionId: string;
    productId: string;
    inspectedQuantity: number;
    passedQuantity: number;
    failedQuantity: number;
    status: QualityInspectionStatus;
    inspectorId?: string;
    inspectionDate?: string;
    remarks?: string;
    outputWarehouseId?: string;
    outputWarehouseLocationId?: string;
    qualityDefects: QualityDefect[];
}

export interface CreateQualityDefectDto {
    defectCode: string;
    defectName: string;
    quantity: number;
    severity: string;
    remarks?: string;
}

export interface UpdateQualityInspectionDto {
    passedQuantity: number;
    failedQuantity: number;
    remarks?: string;
}

export interface QualityInspectionQueueDto {
    id: string;
    inspectionNumber: string;
    productionOrderNumber: string;
    executionNumber: string;
    productId: string;
    productName: string;
    inspectedQuantity: number;
    status: QualityInspectionStatus | string;
    createdAt: string;
    outputWarehouseName: string;
}

export interface QualityDefectAnalysisDto {
    defectCode: string;
    defectName: string;
    productName: string;
    severity: string;
    totalQuantity: number;
    occurrenceCount: number;
}

export interface QualityReleaseLogDto {
    inspectionId: string;
    inspectionNumber: string;
    productName: string;
    executionNumber: string;
    passedQuantity: number;
    status: QualityInspectionStatus | string;
    completedDate?: string;
    warehouseName: string;
}

export interface QualityAttentionItemDto {
    id: string;
    title: string;
    message: string;
    severity: 'high' | 'medium' | 'low' | string;
    type: string;
    linkUrl: string;
}

export interface RecentQualityActivityDto {
    id: string;
    inspectionNumber: string;
    action: string;
    productName: string;
    status: QualityInspectionStatus | string;
    timestamp: string;
}

export interface QualitySummaryDto {
    pendingInspectionsCount: number;
    inProgressInspectionsCount: number;
    passedInspectionsCount: number;
    partiallyPassedInspectionsCount: number;
    failedInspectionsCount: number;
    totalDefectsCount: number;
    totalAcceptedQuantity: number;
    totalRejectedQuantity: number;
    passRatePercentage: number;
    failureRatePercentage: number;
    statusCounts: Record<string, number>;
    inspectionQueue: QualityInspectionQueueDto[];
    defectAnalysis: QualityDefectAnalysisDto[];
    releaseLog: QualityReleaseLogDto[];
    attentionItems: QualityAttentionItemDto[];
    recentActivity: RecentQualityActivityDto[];
}