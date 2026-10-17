import { api } from "@/lib/api-helper";
import {
    NonConformanceReport, CreateNcrDto, UpdateNcrDto, NcrStatus, NcrSeverity,
    Capa, CreateCapaDto, UpdateCapaDto, CapaStatus,
    QualityDisposition, CreateQualityDispositionDto, DispositionStatus,
    ReworkRequest, CreateReworkRequestDto, ReworkStatus,
    ScrapRecord, CreateScrapRecordDto, ScrapStatus,
    QualityComplianceSummary
} from '../types/qualityCompliance.types';
import { PaginatedResponse, PaginationParams } from '../types/api.types';

export const qualityComplianceApi = {
    // NCR
    getNcrs: (params?: PaginationParams & { search?: string; status?: NcrStatus; severity?: NcrSeverity }) =>
        api.get<PaginatedResponse<NonConformanceReport>>('/QualityCompliance/ncrs', { params }),

    getNcrById: (id: string) =>
        api.get<NonConformanceReport>(`/QualityCompliance/ncrs/${id}`),

    createNcr: (data: CreateNcrDto) =>
        api.post<NonConformanceReport>('/QualityCompliance/ncrs', data),

    updateNcr: (id: string, data: UpdateNcrDto) =>
        api.put<NonConformanceReport>(`/QualityCompliance/ncrs/${id}`, data),

    assignNcr: (id: string, assignedToUserId: string) =>
        api.post<NonConformanceReport>(`/QualityCompliance/ncrs/${id}/assign`, { assignedToUserId }),

    updateNcrStatus: (id: string, status: NcrStatus, closureRemarks?: string) =>
        api.post<NonConformanceReport>(`/QualityCompliance/ncrs/${id}/status`, { status, closureRemarks }),

    // CAPA
    getCapas: (params?: PaginationParams & { search?: string; status?: CapaStatus; ncrId?: string }) =>
        api.get<PaginatedResponse<Capa>>('/QualityCompliance/capas', { params }),

    getCapaById: (id: string) =>
        api.get<Capa>(`/QualityCompliance/capas/${id}`),

    createCapa: (data: CreateCapaDto) =>
        api.post<Capa>('/QualityCompliance/capas', data),

    updateCapa: (id: string, data: UpdateCapaDto) =>
        api.put<Capa>(`/QualityCompliance/capas/${id}`, data),

    verifyCapa: (id: string, isEffective: boolean, verificationNotes: string) =>
        api.post<Capa>(`/QualityCompliance/capas/${id}/verify`, { isEffective, verificationNotes }),

    closeCapa: (id: string, notes: string) =>
        api.post<Capa>(`/QualityCompliance/capas/${id}/close`, JSON.stringify(notes), { headers: { 'Content-Type': 'application/json' } }),

    // DISPOSITION
    getDispositions: (params?: PaginationParams & { search?: string; status?: DispositionStatus; inspectionId?: string }) =>
        api.get<PaginatedResponse<QualityDisposition>>('/QualityCompliance/dispositions', { params }),

    getDispositionById: (id: string) =>
        api.get<QualityDisposition>(`/QualityCompliance/dispositions/${id}`),

    createDisposition: (data: CreateQualityDispositionDto) =>
        api.post<QualityDisposition>('/QualityCompliance/dispositions', data),

    approveDisposition: (id: string, approve: boolean, remarks?: string) =>
        api.post<QualityDisposition>(`/QualityCompliance/dispositions/${id}/approve`, { approve, remarks }),

    // REWORK
    getReworkRequests: (params?: PaginationParams & { search?: string; status?: ReworkStatus }) =>
        api.get<PaginatedResponse<ReworkRequest>>('/QualityCompliance/rework', { params }),

    getReworkById: (id: string) =>
        api.get<ReworkRequest>(`/QualityCompliance/rework/${id}`),

    createRework: (data: CreateReworkRequestDto) =>
        api.post<ReworkRequest>('/QualityCompliance/rework', data),

    approveRework: (id: string, approve: boolean, remarks?: string) =>
        api.post<ReworkRequest>(`/QualityCompliance/rework/${id}/approve`, { approve, remarks }),

    startRework: (id: string) =>
        api.post<ReworkRequest>(`/QualityCompliance/rework/${id}/start`),

    completeRework: (id: string, remarks?: string) =>
        api.post<ReworkRequest>(`/QualityCompliance/rework/${id}/complete`, { remarks }),

    // SCRAP
    getScrapRecords: (params?: PaginationParams & { search?: string; status?: ScrapStatus }) =>
        api.get<PaginatedResponse<ScrapRecord>>('/QualityCompliance/scrap', { params }),

    getScrapById: (id: string) =>
        api.get<ScrapRecord>(`/QualityCompliance/scrap/${id}`),

    createScrap: (data: CreateScrapRecordDto) =>
        api.post<ScrapRecord>('/QualityCompliance/scrap', data),

    approveScrap: (id: string, approve: boolean, remarks?: string) =>
        api.post<ScrapRecord>(`/QualityCompliance/scrap/${id}/approve`, { approve, remarks }),

    // REPORT SUMMARY
    getComplianceSummary: () =>
        api.get<QualityComplianceSummary>('/QualityCompliance/reports/summary')
};
