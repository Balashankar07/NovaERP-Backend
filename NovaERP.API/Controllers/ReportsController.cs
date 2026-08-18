using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Reports.DTOs;
using NovaERP.Application.Features.Reports.Interfaces;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("dashboard")]
    [Authorize(Policy = "Permissions.Reports.Dashboard")]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetDashboardSummary(CancellationToken cancellationToken)
    {
        var summary = await _reportService.GetDashboardSummaryAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", summary));
    }

    [HttpGet("procurement")]
    [Authorize(Policy = "Permissions.PurchaseOrders.View")]
    public async Task<ActionResult<ApiResponse<ProcurementSummaryDto>>> GetProcurementSummary(CancellationToken cancellationToken)
    {
        var summary = await _reportService.GetProcurementSummaryAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", summary));
    }

    [HttpGet("inventory/summary")]
    [Authorize(Policy = "Permissions.Inventory.View")]
    public async Task<ActionResult<ApiResponse<InventorySummaryDto>>> GetInventorySummary(CancellationToken cancellationToken)
    {
        var summary = await _reportService.GetInventorySummaryAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", summary));
    }

    [HttpGet("inventory")]
    [Authorize(Policy = "Permissions.Reports.Inventory")]
    public async Task<ActionResult<ApiResponse<PagedResult<InventoryReportDto>>>> GetInventoryReport(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        CancellationToken cancellationToken = default)
    {
        var report = await _reportService.GetInventoryReportAsync(pageNumber, pageSize, searchTerm, sortBy, sortDescending, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", report));
    }

    [HttpGet("production")]
    [Authorize(Policy = "Permissions.Reports.Production")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductionReportDto>>>> GetProductionReport(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        CancellationToken cancellationToken = default)
    {
        var report = await _reportService.GetProductionReportAsync(pageNumber, pageSize, searchTerm, sortBy, sortDescending, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", report));
    }

    [HttpGet("sales")]
    [Authorize(Policy = "Permissions.Reports.Sales")]
    public async Task<ActionResult<ApiResponse<PagedResult<SalesReportDto>>>> GetSalesReport(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        CancellationToken cancellationToken = default)
    {
        var report = await _reportService.GetSalesReportAsync(pageNumber, pageSize, searchTerm, sortBy, sortDescending, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", report));
    }

    [HttpGet("warranty")]
    [Authorize(Policy = "Permissions.Reports.Warranty")]
    public async Task<ActionResult<ApiResponse<PagedResult<WarrantyReportDto>>>> GetWarrantyReport(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        CancellationToken cancellationToken = default)
    {
        var report = await _reportService.GetWarrantyReportAsync(pageNumber, pageSize, searchTerm, sortBy, sortDescending, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", report));
    }

    [HttpGet("audit")]
    [Authorize(Policy = "Permissions.Reports.Audit")]
    public async Task<ActionResult<ApiResponse<PagedResult<AuditReportDto>>>> GetAuditReport(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        CancellationToken cancellationToken = default)
    {
        var report = await _reportService.GetAuditReportAsync(pageNumber, pageSize, searchTerm, sortBy, sortDescending, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", report));
    }
}
