using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.ProductionOperations;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Enums;
using System.Security.Claims;

namespace NovaERP.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductionOperationsController : ControllerBase
{
    private readonly IProductionOperationsService _service;

    public ProductionOperationsController(IProductionOperationsService service)
    {
        _service = service;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private ActionResult<ApiResponse<T>> Success<T>(T data, string message = "Success")
    {
        return Ok(ApiResponse.SuccessResponse(message, data));
    }

    // --- STAGE A: WORK CENTERS ---
    [HttpGet("work-centers")]
    [HasPermission("Permissions.Production.WorkCenters.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<WorkCenterDto>>>> GetWorkCenters(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetWorkCentersAsync(pageNumber, pageSize, search);
        return Success(result);
    }

    [HttpPost("work-centers")]
    [HasPermission("Permissions.Production.WorkCenters.Create")]
    public async Task<ActionResult<ApiResponse<WorkCenterDto>>> CreateWorkCenter([FromBody] CreateWorkCenterDto dto)
    {
        var result = await _service.CreateWorkCenterAsync(dto, GetCurrentUserId());
        return Success(result, "Work Center created successfully.");
    }

    [HttpPut("work-centers/{id}")]
    [HasPermission("Permissions.Production.WorkCenters.Update")]
    public async Task<ActionResult<ApiResponse<WorkCenterDto>>> UpdateWorkCenter(Guid id, [FromBody] UpdateWorkCenterDto dto)
    {
        var result = await _service.UpdateWorkCenterAsync(id, dto, GetCurrentUserId());
        return Success(result, "Work Center updated successfully.");
    }

    // --- STAGE B: MACHINES ---
    [HttpGet("machines")]
    [HasPermission("Permissions.Production.Machines.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<MachineDto>>>> GetMachines(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? workCenterId = null,
        [FromQuery] MachineStatus? status = null)
    {
        var result = await _service.GetMachinesAsync(pageNumber, pageSize, workCenterId, status);
        return Success(result);
    }

    [HttpPost("machines")]
    [HasPermission("Permissions.Production.Machines.Create")]
    public async Task<ActionResult<ApiResponse<MachineDto>>> CreateMachine([FromBody] CreateMachineDto dto)
    {
        var result = await _service.CreateMachineAsync(dto, GetCurrentUserId());
        return Success(result, "Machine created successfully.");
    }

    [HttpPut("machines/{id}")]
    [HasPermission("Permissions.Production.Machines.Update")]
    public async Task<ActionResult<ApiResponse<MachineDto>>> UpdateMachine(Guid id, [FromBody] UpdateMachineDto dto)
    {
        var result = await _service.UpdateMachineAsync(id, dto, GetCurrentUserId());
        return Success(result, "Machine updated successfully.");
    }

    // --- STAGE C: ROUTINGS ---
    [HttpGet("routings")]
    [HasPermission("Permissions.Production.Routings.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductionRoutingDto>>>> GetRoutings(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? productId = null)
    {
        var result = await _service.GetRoutingsAsync(pageNumber, pageSize, productId);
        return Success(result);
    }

    [HttpPost("routings")]
    [HasPermission("Permissions.Production.Routings.Create")]
    public async Task<ActionResult<ApiResponse<ProductionRoutingDto>>> CreateRouting([FromBody] CreateProductionRoutingDto dto)
    {
        var result = await _service.CreateRoutingAsync(dto, GetCurrentUserId());
        return Success(result, "Production Routing created successfully.");
    }

    [HttpGet("routings/product/{productId}")]
    [HasPermission("Permissions.Production.Routings.View")]
    public async Task<ActionResult<ApiResponse<ProductionRoutingDto?>>> GetRoutingByProduct(Guid productId)
    {
        var result = await _service.GetRoutingByProductAsync(productId);
        return Success(result);
    }

    // --- STAGE D: WORKER ASSIGNMENT ---
    [HttpGet("assignments")]
    [HasPermission("Permissions.Production.Assignments.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductionWorkerAssignmentDto>>>> GetWorkerAssignments(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? executionId = null,
        [FromQuery] Guid? employeeId = null)
    {
        var result = await _service.GetWorkerAssignmentsAsync(pageNumber, pageSize, executionId, employeeId);
        return Success(result);
    }

    [HttpPost("assignments")]
    [HasPermission("Permissions.Production.Assignments.Create")]
    public async Task<ActionResult<ApiResponse<ProductionWorkerAssignmentDto>>> AssignWorker([FromBody] CreateWorkerAssignmentDto dto)
    {
        var result = await _service.AssignWorkerAsync(dto, GetCurrentUserId());
        return Success(result, "Worker assigned successfully.");
    }

    [HttpPut("assignments/{id}/complete")]
    [HasPermission("Permissions.Production.Assignments.Update")]
    public async Task<ActionResult<ApiResponse<ProductionWorkerAssignmentDto>>> CompleteWorkerAssignment(Guid id)
    {
        var result = await _service.CompleteWorkerAssignmentAsync(id, GetCurrentUserId());
        return Success(result, "Worker assignment marked completed.");
    }

    // --- STAGE E: SCHEDULING ---
    [HttpGet("schedules")]
    [HasPermission("Permissions.Production.Schedules.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductionScheduleDto>>>> GetSchedules(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? productionOrderId = null,
        [FromQuery] Guid? workCenterId = null,
        [FromQuery] ScheduleStatus? status = null)
    {
        var result = await _service.GetSchedulesAsync(pageNumber, pageSize, productionOrderId, workCenterId, status);
        return Success(result);
    }

    [HttpPost("schedules")]
    [HasPermission("Permissions.Production.Schedules.Create")]
    public async Task<ActionResult<ApiResponse<ProductionScheduleDto>>> CreateSchedule([FromBody] CreateProductionScheduleDto dto)
    {
        var result = await _service.CreateScheduleAsync(dto, GetCurrentUserId());
        return Success(result, "Production schedule created successfully.");
    }

    [HttpPut("schedules/{id}/status")]
    [HasPermission("Permissions.Production.Schedules.Update")]
    public async Task<ActionResult<ApiResponse<ProductionScheduleDto>>> UpdateScheduleStatus(Guid id, [FromBody] UpdateScheduleStatusDto dto)
    {
        var result = await _service.UpdateScheduleStatusAsync(id, dto, GetCurrentUserId());
        return Success(result, "Production schedule status updated.");
    }

    // --- STAGE G: EVENTS / DOWNTIME ---
    [HttpGet("events")]
    [HasPermission("Permissions.Production.Events.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductionEventDto>>>> GetEvents(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? executionId = null,
        [FromQuery] Guid? machineId = null,
        [FromQuery] ProductionEventType? eventType = null)
    {
        var result = await _service.GetEventsAsync(pageNumber, pageSize, executionId, machineId, eventType);
        return Success(result);
    }

    [HttpPost("events")]
    [HasPermission("Permissions.Production.Events.Create")]
    public async Task<ActionResult<ApiResponse<ProductionEventDto>>> CreateEvent([FromBody] CreateProductionEventDto dto)
    {
        var result = await _service.CreateEventAsync(dto, GetCurrentUserId());
        return Success(result, "Production event logged successfully.");
    }

    // --- STAGE H: REPORTS SUMMARY ---
    [HttpGet("reports/summary")]
    [HasPermission("Permissions.Production.Reports.View")]
    public async Task<ActionResult<ApiResponse<ProductionOperationsSummaryDto>>> GetSummaryReport()
    {
        var result = await _service.GetSummaryReportAsync();
        return Success(result);
    }
}
