using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.QualityCompliance;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Enums;
using System.Security.Claims;

namespace NovaERP.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class QualityComplianceController : ControllerBase
{
    private readonly IQualityComplianceService _service;

    public QualityComplianceController(IQualityComplianceService service)
    {
        _service = service;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("User identification is missing or invalid.");
        return id;
    }

    private ActionResult<ApiResponse<T>> Success<T>(T data, string message = "Success")
    {
        return Ok(ApiResponse.SuccessResponse(message, data));
    }

    // ==========================================
    // STAGE A: NCR
    // ==========================================
    [HttpGet("ncrs")]
    [HasPermission("Permissions.Quality.NCR.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<NonConformanceReportDto>>>> GetNcrs(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] NcrStatus? status = null,
        [FromQuery] NcrSeverity? severity = null)
    {
        var result = await _service.GetNcrsAsync(pageNumber, pageSize, search, status, severity);
        return Success(result);
    }

    [HttpGet("ncrs/{id}")]
    [HasPermission("Permissions.Quality.NCR.View")]
    public async Task<ActionResult<ApiResponse<NonConformanceReportDto>>> GetNcrById(Guid id)
    {
        var result = await _service.GetNcrByIdAsync(id);
        return Success(result);
    }

    [HttpPost("ncrs")]
    [HasPermission("Permissions.Quality.NCR.Create")]
    public async Task<ActionResult<ApiResponse<NonConformanceReportDto>>> CreateNcr([FromBody] CreateNcrDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.CreateNcrAsync(dto, currentUserId);
        return Success(result, "NCR created successfully.");
    }

    [HttpPut("ncrs/{id}")]
    [HasPermission("Permissions.Quality.NCR.Update")]
    public async Task<ActionResult<ApiResponse<NonConformanceReportDto>>> UpdateNcr(Guid id, [FromBody] UpdateNcrDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.UpdateNcrAsync(id, dto, currentUserId);
        return Success(result, "NCR updated successfully.");
    }

    [HttpPost("ncrs/{id}/assign")]
    [HasPermission("Permissions.Quality.NCR.Assign")]
    public async Task<ActionResult<ApiResponse<NonConformanceReportDto>>> AssignNcr(Guid id, [FromBody] AssignNcrDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.AssignNcrAsync(id, dto, currentUserId);
        return Success(result, "NCR assigned successfully.");
    }

    [HttpPost("ncrs/{id}/status")]
    [HasPermission("Permissions.Quality.NCR.Update")]
    public async Task<ActionResult<ApiResponse<NonConformanceReportDto>>> UpdateNcrStatus(Guid id, [FromBody] UpdateNcrStatusDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.UpdateNcrStatusAsync(id, dto, currentUserId);
        return Success(result, "NCR status updated successfully.");
    }

    // ==========================================
    // STAGE B: CAPA
    // ==========================================
    [HttpGet("capas")]
    [HasPermission("Permissions.Quality.CAPA.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<CapaDto>>>> GetCapas(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] CapaStatus? status = null,
        [FromQuery] Guid? ncrId = null)
    {
        var result = await _service.GetCapasAsync(pageNumber, pageSize, search, status, ncrId);
        return Success(result);
    }

    [HttpGet("capas/{id}")]
    [HasPermission("Permissions.Quality.CAPA.View")]
    public async Task<ActionResult<ApiResponse<CapaDto>>> GetCapaById(Guid id)
    {
        var result = await _service.GetCapaByIdAsync(id);
        return Success(result);
    }

    [HttpPost("capas")]
    [HasPermission("Permissions.Quality.CAPA.Create")]
    public async Task<ActionResult<ApiResponse<CapaDto>>> CreateCapa([FromBody] CreateCapaDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.CreateCapaAsync(dto, currentUserId);
        return Success(result, "CAPA created successfully.");
    }

    [HttpPut("capas/{id}")]
    [HasPermission("Permissions.Quality.CAPA.Update")]
    public async Task<ActionResult<ApiResponse<CapaDto>>> UpdateCapa(Guid id, [FromBody] UpdateCapaDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.UpdateCapaAsync(id, dto, currentUserId);
        return Success(result, "CAPA updated successfully.");
    }

    [HttpPost("capas/{id}/verify")]
    [HasPermission("Permissions.Quality.CAPA.Verify")]
    public async Task<ActionResult<ApiResponse<CapaDto>>> VerifyCapa(Guid id, [FromBody] VerifyCapaDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.VerifyCapaAsync(id, dto, currentUserId);
        return Success(result, "CAPA verification recorded successfully.");
    }

    [HttpPost("capas/{id}/close")]
    [HasPermission("Permissions.Quality.CAPA.Close")]
    public async Task<ActionResult<ApiResponse<CapaDto>>> CloseCapa(Guid id, [FromBody] string notes)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.CloseCapaAsync(id, notes, currentUserId);
        return Success(result, "CAPA closed successfully.");
    }

    // ==========================================
    // STAGE C: QUALITY DISPOSITION
    // ==========================================
    [HttpGet("dispositions")]
    [HasPermission("Permissions.Quality.Disposition.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<QualityDispositionDto>>>> GetDispositions(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] DispositionStatus? status = null,
        [FromQuery] Guid? inspectionId = null)
    {
        var result = await _service.GetDispositionsAsync(pageNumber, pageSize, search, status, inspectionId);
        return Success(result);
    }

    [HttpGet("dispositions/{id}")]
    [HasPermission("Permissions.Quality.Disposition.View")]
    public async Task<ActionResult<ApiResponse<QualityDispositionDto>>> GetDispositionById(Guid id)
    {
        var result = await _service.GetDispositionByIdAsync(id);
        return Success(result);
    }

    [HttpPost("dispositions")]
    [HasPermission("Permissions.Quality.Disposition.Create")]
    public async Task<ActionResult<ApiResponse<QualityDispositionDto>>> CreateDisposition([FromBody] CreateQualityDispositionDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.CreateDispositionAsync(dto, currentUserId);
        return Success(result, "Quality Disposition created successfully.");
    }

    [HttpPost("dispositions/{id}/approve")]
    [HasPermission("Permissions.Quality.Disposition.Approve")]
    public async Task<ActionResult<ApiResponse<QualityDispositionDto>>> ApproveDisposition(Guid id, [FromBody] ApproveDispositionDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.ApproveDispositionAsync(id, dto, currentUserId);
        return Success(result, "Disposition status updated successfully.");
    }

    // ==========================================
    // STAGE D: REWORK
    // ==========================================
    [HttpGet("rework")]
    [HasPermission("Permissions.Quality.Rework.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<ReworkRequestDto>>>> GetReworkRequests(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] ReworkStatus? status = null)
    {
        var result = await _service.GetReworkRequestsAsync(pageNumber, pageSize, search, status);
        return Success(result);
    }

    [HttpGet("rework/{id}")]
    [HasPermission("Permissions.Quality.Rework.View")]
    public async Task<ActionResult<ApiResponse<ReworkRequestDto>>> GetReworkRequestById(Guid id)
    {
        var result = await _service.GetReworkRequestByIdAsync(id);
        return Success(result);
    }

    [HttpPost("rework")]
    [HasPermission("Permissions.Quality.Rework.Create")]
    public async Task<ActionResult<ApiResponse<ReworkRequestDto>>> CreateReworkRequest([FromBody] CreateReworkRequestDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.CreateReworkRequestAsync(dto, currentUserId);
        return Success(result, "Rework Request created successfully.");
    }

    [HttpPost("rework/{id}/approve")]
    [HasPermission("Permissions.Quality.Rework.Approve")]
    public async Task<ActionResult<ApiResponse<ReworkRequestDto>>> ApproveReworkRequest(Guid id, [FromBody] ApproveReworkDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.ApproveReworkRequestAsync(id, dto, currentUserId);
        return Success(result, "Rework Request approval status updated.");
    }

    [HttpPost("rework/{id}/start")]
    [HasPermission("Permissions.Quality.Rework.Approve")]
    public async Task<ActionResult<ApiResponse<ReworkRequestDto>>> StartRework(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.StartReworkAsync(id, currentUserId);
        return Success(result, "Rework process started.");
    }

    [HttpPost("rework/{id}/complete")]
    [HasPermission("Permissions.Quality.Rework.Complete")]
    public async Task<ActionResult<ApiResponse<ReworkRequestDto>>> CompleteReworkRequest(Guid id, [FromBody] CompleteReworkDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.CompleteReworkRequestAsync(id, dto, currentUserId);
        return Success(result, "Rework Request completed successfully.");
    }

    // ==========================================
    // STAGE E: SCRAP
    // ==========================================
    [HttpGet("scrap")]
    [HasPermission("Permissions.Quality.Scrap.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<ScrapRecordDto>>>> GetScrapRecords(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] ScrapStatus? status = null)
    {
        var result = await _service.GetScrapRecordsAsync(pageNumber, pageSize, search, status);
        return Success(result);
    }

    [HttpGet("scrap/{id}")]
    [HasPermission("Permissions.Quality.Scrap.View")]
    public async Task<ActionResult<ApiResponse<ScrapRecordDto>>> GetScrapRecordById(Guid id)
    {
        var result = await _service.GetScrapRecordByIdAsync(id);
        return Success(result);
    }

    [HttpPost("scrap")]
    [HasPermission("Permissions.Quality.Scrap.Create")]
    public async Task<ActionResult<ApiResponse<ScrapRecordDto>>> CreateScrapRecord([FromBody] CreateScrapRecordDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.CreateScrapRecordAsync(dto, currentUserId);
        return Success(result, "Scrap Record created successfully.");
    }

    [HttpPost("scrap/{id}/approve")]
    [HasPermission("Permissions.Quality.Scrap.Approve")]
    public async Task<ActionResult<ApiResponse<ScrapRecordDto>>> ApproveScrapRecord(Guid id, [FromBody] ApproveScrapDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _service.ApproveScrapRecordAsync(id, dto, currentUserId);
        return Success(result, "Scrap Record approval status updated.");
    }

    // ==========================================
    // STAGE G: QUALITY COMPLIANCE SUMMARY REPORT
    // ==========================================
    [HttpGet("reports/summary")]
    [HasPermission("Permissions.Quality.Reports.View")]
    public async Task<ActionResult<ApiResponse<QualityComplianceSummaryDto>>> GetComplianceSummaryReport()
    {
        var result = await _service.GetComplianceSummaryReportAsync();
        return Success(result);
    }
}
