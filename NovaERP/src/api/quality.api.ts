import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { QualityInspection, QualityInspectionStatus, CreateQualityDefectDto, UpdateQualityInspectionDto, QualitySummaryDto } from '../types/quality.types';
import { PaginatedResponse, PaginationParams } from '../types/api.types';

export const qualityApi = {
    getAll: (params?: PaginationParams & { search?: string, status?: QualityInspectionStatus, sortBy?: string, sortOrder?: string }) => 
        api.get<PaginatedResponse<QualityInspection>>('/QualityInspections', { params }),

    getById: (id: string) => 
        api.get<QualityInspection>(`/QualityInspections/${id}`),

    update: (id: string, data: UpdateQualityInspectionDto) => 
        api.put<QualityInspection>(`/QualityInspections/${id}`, data),

    start: (id: string) => 
        api.post<QualityInspection>(`/QualityInspections/${id}/start`),

    complete: (id: string) => 
        api.post<QualityInspection>(`/QualityInspections/${id}/complete`),

    cancel: (id: string, reason: string) => 
        api.post<QualityInspection>(`/QualityInspections/${id}/cancel?reason=${reason}`),

    addDefect: (id: string, data: CreateQualityDefectDto) => 
        api.post<QualityInspection>(`/QualityInspections/${id}/defects`, data),

    removeDefect: (id: string, defectId: string) => 
        api.delete<boolean>(`/QualityInspections/${id}/defects/${defectId}`),

    getSummary: () =>
        api.get<QualitySummaryDto>(API_ENDPOINTS.REPORTS.QUALITY_SUMMARY)
};

export const qualityInspectionsApi = qualityApi;