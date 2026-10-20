using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.ProductionOperations;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Interfaces.Services;

public interface IProductionOperationsService
{
    // Work Centers
    Task<PagedResult<WorkCenterDto>> GetWorkCentersAsync(int pageNumber = 1, int pageSize = 10, string? search = null);
    Task<WorkCenterDto> CreateWorkCenterAsync(CreateWorkCenterDto dto, Guid? currentUserId = null);
    Task<WorkCenterDto> UpdateWorkCenterAsync(Guid id, UpdateWorkCenterDto dto, Guid? currentUserId = null);

    // Machines
    Task<PagedResult<MachineDto>> GetMachinesAsync(int pageNumber = 1, int pageSize = 10, Guid? workCenterId = null, MachineStatus? status = null);
    Task<MachineDto> CreateMachineAsync(CreateMachineDto dto, Guid? currentUserId = null);
    Task<MachineDto> UpdateMachineAsync(Guid id, UpdateMachineDto dto, Guid? currentUserId = null);

    // Routings
    Task<PagedResult<ProductionRoutingDto>> GetRoutingsAsync(int pageNumber = 1, int pageSize = 10, Guid? productId = null);
    Task<ProductionRoutingDto> CreateRoutingAsync(CreateProductionRoutingDto dto, Guid? currentUserId = null);
    Task<ProductionRoutingDto?> GetRoutingByProductAsync(Guid productId);

    // Worker Assignments
    Task<PagedResult<ProductionWorkerAssignmentDto>> GetWorkerAssignmentsAsync(int pageNumber = 1, int pageSize = 10, Guid? executionId = null, Guid? employeeId = null);
    Task<ProductionWorkerAssignmentDto> AssignWorkerAsync(CreateWorkerAssignmentDto dto, Guid? currentUserId = null);
    Task<ProductionWorkerAssignmentDto> CompleteWorkerAssignmentAsync(Guid id, Guid? currentUserId = null);

    // Scheduling
    Task<PagedResult<ProductionScheduleDto>> GetSchedulesAsync(int pageNumber = 1, int pageSize = 10, Guid? productionOrderId = null, Guid? workCenterId = null, ScheduleStatus? status = null);
    Task<ProductionScheduleDto> CreateScheduleAsync(CreateProductionScheduleDto dto, Guid? currentUserId = null);
    Task<ProductionScheduleDto> UpdateScheduleStatusAsync(Guid id, UpdateScheduleStatusDto dto, Guid? currentUserId = null);

    // Events / Downtime
    Task<PagedResult<ProductionEventDto>> GetEventsAsync(int pageNumber = 1, int pageSize = 10, Guid? executionId = null, Guid? machineId = null, ProductionEventType? eventType = null);
    Task<ProductionEventDto> CreateEventAsync(CreateProductionEventDto dto, Guid? currentUserId = null);

    // Reports Summary
    Task<ProductionOperationsSummaryDto> GetSummaryReportAsync();
}
