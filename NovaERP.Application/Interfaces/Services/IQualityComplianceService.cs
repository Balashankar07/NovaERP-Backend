using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.QualityCompliance;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Interfaces.Services;

public interface IQualityComplianceService
{
    // STAGE A: NCR
    Task<PagedResult<NonConformanceReportDto>> GetNcrsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, NcrStatus? status = null, NcrSeverity? severity = null);
    Task<NonConformanceReportDto> GetNcrByIdAsync(Guid id);
    Task<NonConformanceReportDto> CreateNcrAsync(CreateNcrDto dto, Guid currentUserId);
    Task<NonConformanceReportDto> UpdateNcrAsync(Guid id, UpdateNcrDto dto, Guid currentUserId);
    Task<NonConformanceReportDto> AssignNcrAsync(Guid id, AssignNcrDto dto, Guid currentUserId);
    Task<NonConformanceReportDto> UpdateNcrStatusAsync(Guid id, UpdateNcrStatusDto dto, Guid currentUserId);

    // STAGE B: CAPA
    Task<PagedResult<CapaDto>> GetCapasAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CapaStatus? status = null, Guid? ncrId = null);
    Task<CapaDto> GetCapaByIdAsync(Guid id);
    Task<CapaDto> CreateCapaAsync(CreateCapaDto dto, Guid currentUserId);
    Task<CapaDto> UpdateCapaAsync(Guid id, UpdateCapaDto dto, Guid currentUserId);
    Task<CapaDto> VerifyCapaAsync(Guid id, VerifyCapaDto dto, Guid currentUserId);
    Task<CapaDto> CloseCapaAsync(Guid id, string notes, Guid currentUserId);

    // STAGE C: Quality Disposition
    Task<PagedResult<QualityDispositionDto>> GetDispositionsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, DispositionStatus? status = null, Guid? inspectionId = null);
    Task<QualityDispositionDto> GetDispositionByIdAsync(Guid id);
    Task<QualityDispositionDto> CreateDispositionAsync(CreateQualityDispositionDto dto, Guid currentUserId);
    Task<QualityDispositionDto> ApproveDispositionAsync(Guid id, ApproveDispositionDto dto, Guid currentUserId);

    // STAGE D: Rework
    Task<PagedResult<ReworkRequestDto>> GetReworkRequestsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, ReworkStatus? status = null);
    Task<ReworkRequestDto> GetReworkRequestByIdAsync(Guid id);
    Task<ReworkRequestDto> CreateReworkRequestAsync(CreateReworkRequestDto dto, Guid currentUserId);
    Task<ReworkRequestDto> ApproveReworkRequestAsync(Guid id, ApproveReworkDto dto, Guid currentUserId);
    Task<ReworkRequestDto> StartReworkAsync(Guid id, Guid currentUserId);
    Task<ReworkRequestDto> CompleteReworkRequestAsync(Guid id, CompleteReworkDto dto, Guid currentUserId);

    // STAGE E: Scrap
    Task<PagedResult<ScrapRecordDto>> GetScrapRecordsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, ScrapStatus? status = null);
    Task<ScrapRecordDto> GetScrapRecordByIdAsync(Guid id);
    Task<ScrapRecordDto> CreateScrapRecordAsync(CreateScrapRecordDto dto, Guid currentUserId);
    Task<ScrapRecordDto> ApproveScrapRecordAsync(Guid id, ApproveScrapDto dto, Guid currentUserId);

    // STAGE G: Quality Compliance Summary Report
    Task<QualityComplianceSummaryDto> GetComplianceSummaryReportAsync();
}
