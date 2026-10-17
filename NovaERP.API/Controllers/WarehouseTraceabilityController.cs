using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Inventory.DTOs;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Enums;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WarehouseTraceabilityController : ControllerBase
{
    private readonly IWarehouseTraceabilityService _traceabilityService;
    private readonly ICurrentUserService _currentUser;

    public WarehouseTraceabilityController(
        IWarehouseTraceabilityService traceabilityService,
        ICurrentUserService currentUser)
    {
        _traceabilityService = traceabilityService;
        _currentUser = currentUser;
    }

    // ──────────────────────────────────────────────────────────────────────
    // LOCATION HIERARCHY
    // ──────────────────────────────────────────────────────────────────────

    [HttpGet("locations/hierarchy/{warehouseId}")]
    [HasPermission("Permissions.WarehouseLocations.View")]
    public async Task<IActionResult> GetLocationHierarchy(Guid warehouseId)
    {
        var result = await _traceabilityService.GetLocationHierarchyAsync(warehouseId);
        return Ok(ApiResponse.SuccessResponse("Location hierarchy fetched successfully.", result));
    }

    [HttpPost("locations")]
    [HasPermission("Permissions.WarehouseLocations.Create")]
    public async Task<IActionResult> CreateLocation([FromBody] CreateHierarchicalLocationDto dto)
    {
        var result = await _traceabilityService.CreateLocationAsync(dto, _currentUser.UserId);
        return Ok(ApiResponse.SuccessResponse("Hierarchical location created successfully.", result));
    }

    // ──────────────────────────────────────────────────────────────────────
    // PRODUCT TRACKING MODE
    // ──────────────────────────────────────────────────────────────────────

    [HttpPut("products/{productId}/tracking-mode")]
    [HasPermission("Permissions.Products.Update")]
    public async Task<IActionResult> UpdateTrackingMode(Guid productId, [FromBody] UpdateProductTrackingModeDto dto)
    {
        await _traceabilityService.UpdateProductTrackingModeAsync(productId, dto.TrackingMode, _currentUser.UserId);
        return Ok(ApiResponse.SuccessResponse($"Product tracking mode updated to {dto.TrackingMode}."));
    }

    // ──────────────────────────────────────────────────────────────────────
    // BATCH / LOT MANAGEMENT
    // ──────────────────────────────────────────────────────────────────────

    [HttpGet("batches")]
    [HasPermission("Permissions.Warehouse.Batches.View")]
    public async Task<IActionResult> GetBatches(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? productId = null,
        [FromQuery] Guid? warehouseId = null,
        [FromQuery] BatchStatus? status = null)
    {
        var result = await _traceabilityService.GetBatchesAsync(pageNumber, pageSize, productId, warehouseId, status);
        return Ok(ApiResponse.SuccessResponse("Batches fetched successfully.", result));
    }

    [HttpPost("batches")]
    [HasPermission("Permissions.Warehouse.Batches.Create")]
    public async Task<IActionResult> CreateBatch([FromBody] CreateInventoryBatchDto dto)
    {
        var result = await _traceabilityService.CreateBatchAsync(dto, _currentUser.UserId);
        return Ok(ApiResponse.SuccessResponse("Inventory batch created successfully.", result));
    }

    [HttpPut("batches/{batchId}/status")]
    [HasPermission("Permissions.Warehouse.Batches.Update")]
    public async Task<IActionResult> UpdateBatchStatus(Guid batchId, [FromBody] UpdateBatchStatusDto dto)
    {
        var result = await _traceabilityService.UpdateBatchStatusAsync(batchId, dto.Status, dto.Remarks, _currentUser.UserId);
        return Ok(ApiResponse.SuccessResponse("Batch status updated successfully.", result));
    }

    // ──────────────────────────────────────────────────────────────────────
    // SERIAL NUMBER MANAGEMENT
    // ──────────────────────────────────────────────────────────────────────

    [HttpGet("serials")]
    [HasPermission("Permissions.Warehouse.Serials.View")]
    public async Task<IActionResult> GetSerials(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? productId = null,
        [FromQuery] Guid? warehouseId = null,
        [FromQuery] SerialStatus? status = null)
    {
        var result = await _traceabilityService.GetSerialsAsync(pageNumber, pageSize, productId, warehouseId, status);
        return Ok(ApiResponse.SuccessResponse("Serial numbers fetched successfully.", result));
    }

    [HttpPost("serials")]
    [HasPermission("Permissions.Warehouse.Serials.Create")]
    public async Task<IActionResult> RegisterSerials([FromBody] RegisterSerialNumbersDto dto)
    {
        var result = await _traceabilityService.RegisterSerialsAsync(dto, _currentUser.UserId);
        return Ok(ApiResponse.SuccessResponse("Serial numbers registered successfully.", result));
    }

    [HttpPut("serials/{serialId}/status")]
    [HasPermission("Permissions.Warehouse.Serials.Update")]
    public async Task<IActionResult> UpdateSerialStatus(Guid serialId, [FromBody] UpdateSerialStatusDto dto)
    {
        var result = await _traceabilityService.UpdateSerialStatusAsync(serialId, dto.Status, dto.Remarks, _currentUser.UserId);
        return Ok(ApiResponse.SuccessResponse("Serial number status updated successfully.", result));
    }

    // ──────────────────────────────────────────────────────────────────────
    // DAMAGED / BLOCKED STOCK
    // ──────────────────────────────────────────────────────────────────────

    [HttpGet("damaged-blocked/batches")]
    [HasPermission("Permissions.Warehouse.DamagedStock.View")]
    public async Task<IActionResult> GetDamagedOrBlockedBatches([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _traceabilityService.GetDamagedOrBlockedBatchesAsync(pageNumber, pageSize);
        return Ok(ApiResponse.SuccessResponse("Damaged / blocked batches fetched successfully.", result));
    }

    [HttpGet("damaged-blocked/serials")]
    [HasPermission("Permissions.Warehouse.DamagedStock.View")]
    public async Task<IActionResult> GetDamagedOrBlockedSerials([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _traceabilityService.GetDamagedOrBlockedSerialsAsync(pageNumber, pageSize);
        return Ok(ApiResponse.SuccessResponse("Damaged / blocked serials fetched successfully.", result));
    }

    // ──────────────────────────────────────────────────────────────────────
    // TRACEABILITY TIMELINE & REPORTS
    // ──────────────────────────────────────────────────────────────────────

    [HttpGet("trace/{productId}")]
    [HasPermission("Permissions.Warehouse.Traceability.View")]
    public async Task<IActionResult> GetProductTraceability(Guid productId)
    {
        var result = await _traceabilityService.GetProductTraceabilityAsync(productId);
        return Ok(ApiResponse.SuccessResponse("Product traceability timeline fetched successfully.", result));
    }

    [HttpGet("reports/summary")]
    [HasPermission("Permissions.Warehouse.Reports.View")]
    public async Task<IActionResult> GetReportsSummary()
    {
        var result = await _traceabilityService.GetReportsSummaryAsync();
        return Ok(ApiResponse.SuccessResponse("Warehouse traceability report summary fetched successfully.", result));
    }
}
