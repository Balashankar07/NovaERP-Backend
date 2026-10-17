using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.DTOs.SupplierPerformance;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupplierPerformanceController : ControllerBase
{
    private readonly ISupplierPerformanceService _performanceService;
    private readonly ICurrentUserService _currentUserService;

    public SupplierPerformanceController(
        ISupplierPerformanceService performanceService,
        ICurrentUserService currentUserService)
    {
        _performanceService = performanceService;
        _currentUserService = currentUserService;
    }

    [HttpGet("overview")]
    [HasPermission("Permissions.SupplierPerformance.View")]
    public async Task<ActionResult<SupplierPerformanceOverviewDto>> GetOverview(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var overview = await _performanceService.GetOverviewAsync(startDate, endDate);
        return Ok(overview);
    }

    [HttpGet("suppliers")]
    [HasPermission("Permissions.SupplierPerformance.View")]
    public async Task<ActionResult<List<SupplierPerformanceSummaryDto>>> GetAllSupplierSummaries(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var summaries = await _performanceService.GetAllSupplierSummariesAsync(startDate, endDate);
        return Ok(summaries);
    }

    [HttpGet("suppliers/{supplierId}")]
    [HasPermission("Permissions.SupplierPerformance.View")]
    public async Task<ActionResult<SupplierPerformanceSummaryDto>> GetSupplierSummaryById(
        Guid supplierId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var summary = await _performanceService.GetSupplierSummaryByIdAsync(supplierId, startDate, endDate);
        if (summary == null) return NotFound(new { message = $"Supplier with ID {supplierId} not found." });
        return Ok(summary);
    }

    [HttpGet("suppliers/{supplierId}/scorecard")]
    [HasPermission("Permissions.SupplierPerformance.Scorecards.View")]
    public async Task<ActionResult<SupplierScorecardDetailDto>> GetSupplierScorecardById(
        Guid supplierId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var scorecard = await _performanceService.GetSupplierScorecardByIdAsync(supplierId, startDate, endDate);
        if (scorecard == null) return NotFound(new { message = $"Supplier with ID {supplierId} not found." });
        return Ok(scorecard);
    }

    [HttpGet("suppliers/{supplierId}/history")]
    [HasPermission("Permissions.SupplierPerformance.Reports.View")]
    public async Task<ActionResult<List<SupplierMonthlyPerformanceDto>>> GetSupplierMonthlyHistory(
        Guid supplierId,
        [FromQuery] int months = 12)
    {
        var history = await _performanceService.GetSupplierMonthlyHistoryAsync(supplierId, months);
        return Ok(history);
    }

    [HttpGet("config")]
    [HasPermission("Permissions.SupplierPerformance.Scorecards.View")]
    public async Task<ActionResult<SupplierScorecardConfigDto>> GetScorecardConfig()
    {
        var config = await _performanceService.GetScorecardConfigAsync();
        return Ok(config);
    }

    [HttpPut("config")]
    [HasPermission("Permissions.SupplierPerformance.Configure")]
    public async Task<ActionResult<SupplierScorecardConfigDto>> UpdateScorecardConfig(
        [FromBody] UpdateSupplierScorecardConfigDto dto)
    {
        var userId = _currentUserService.UserId;
        var updatedConfig = await _performanceService.UpdateScorecardConfigAsync(dto, userId);
        return Ok(updatedConfig);
    }
}
