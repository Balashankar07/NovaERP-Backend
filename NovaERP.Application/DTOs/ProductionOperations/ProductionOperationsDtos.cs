using NovaERP.Domain.Enums;

namespace NovaERP.Application.DTOs.ProductionOperations;

// Work Center DTOs
public class WorkCenterDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public Guid? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public decimal Capacity { get; set; }
    public bool IsActive { get; set; }
    public int ActiveMachineCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateWorkCenterDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? WarehouseId { get; set; }
    public decimal Capacity { get; set; } = 1.0m;
}

public class UpdateWorkCenterDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? WarehouseId { get; set; }
    public decimal Capacity { get; set; } = 1.0m;
    public bool IsActive { get; set; } = true;
}

// Machine DTOs
public class MachineDto
{
    public Guid Id { get; set; }
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public Guid WorkCenterId { get; set; }
    public string WorkCenterCode { get; set; } = string.Empty;
    public string WorkCenterName { get; set; } = string.Empty;
    public string MachineType { get; set; } = "Standard";
    public MachineStatus Status { get; set; }
    public decimal Capacity { get; set; }
    public string? Location { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMachineDto
{
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public Guid WorkCenterId { get; set; }
    public string MachineType { get; set; } = "Standard";
    public decimal Capacity { get; set; } = 1.0m;
    public string? Location { get; set; }
}

public class UpdateMachineDto
{
    public string MachineName { get; set; } = string.Empty;
    public Guid WorkCenterId { get; set; }
    public string MachineType { get; set; } = "Standard";
    public MachineStatus Status { get; set; }
    public decimal Capacity { get; set; } = 1.0m;
    public string? Location { get; set; }
    public bool IsActive { get; set; } = true;
}

// Routing DTOs
public class ProductionRoutingDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0";
    public bool IsActive { get; set; }
    public List<ProductionRoutingOperationDto> Operations { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class ProductionRoutingOperationDto
{
    public Guid Id { get; set; }
    public Guid RoutingId { get; set; }
    public int SequenceNumber { get; set; }
    public string OperationName { get; set; } = string.Empty;
    public Guid WorkCenterId { get; set; }
    public string WorkCenterName { get; set; } = string.Empty;
    public Guid? MachineId { get; set; }
    public string? MachineName { get; set; }
    public int StandardDurationMinutes { get; set; }
    public int SetupDurationMinutes { get; set; }
    public string? Description { get; set; }
}

public class CreateProductionRoutingDto
{
    public Guid ProductId { get; set; }
    public string Version { get; set; } = "1.0";
    public List<CreateRoutingOperationDto> Operations { get; set; } = new();
}

public class CreateRoutingOperationDto
{
    public int SequenceNumber { get; set; }
    public string OperationName { get; set; } = string.Empty;
    public Guid WorkCenterId { get; set; }
    public Guid? MachineId { get; set; }
    public int StandardDurationMinutes { get; set; }
    public int SetupDurationMinutes { get; set; }
    public string? Description { get; set; }
}

// Worker Assignment DTOs
public class ProductionWorkerAssignmentDto
{
    public Guid Id { get; set; }
    public Guid ProductionExecutionId { get; set; }
    public string ExecutionNumber { get; set; } = string.Empty;
    public Guid EmployeeId { get; set; }
    public string EmployeeNumber { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string RoleOrFunction { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

public class CreateWorkerAssignmentDto
{
    public Guid ProductionExecutionId { get; set; }
    public Guid EmployeeId { get; set; }
    public string RoleOrFunction { get; set; } = "Operator";
    public string? Remarks { get; set; }
}

// Schedule DTOs
public class ProductionScheduleDto
{
    public Guid Id { get; set; }
    public Guid ProductionOrderId { get; set; }
    public string ProductionOrderNumber { get; set; } = string.Empty;
    public Guid? OperationId { get; set; }
    public string? OperationName { get; set; }
    public Guid WorkCenterId { get; set; }
    public string WorkCenterName { get; set; } = string.Empty;
    public Guid? MachineId { get; set; }
    public string? MachineName { get; set; }
    public DateTime PlannedStart { get; set; }
    public DateTime PlannedEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public ScheduleStatus Status { get; set; }
    public string? Remarks { get; set; }
}

public class CreateProductionScheduleDto
{
    public Guid ProductionOrderId { get; set; }
    public Guid? OperationId { get; set; }
    public Guid WorkCenterId { get; set; }
    public Guid? MachineId { get; set; }
    public DateTime PlannedStart { get; set; }
    public DateTime PlannedEnd { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateScheduleStatusDto
{
    public ScheduleStatus Status { get; set; }
    public string? Remarks { get; set; }
}

// Event DTOs
public class ProductionEventDto
{
    public Guid Id { get; set; }
    public Guid ProductionExecutionId { get; set; }
    public string ExecutionNumber { get; set; } = string.Empty;
    public Guid? MachineId { get; set; }
    public string? MachineName { get; set; }
    public Guid? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public ProductionEventType EventType { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

public class CreateProductionEventDto
{
    public Guid ProductionExecutionId { get; set; }
    public Guid? MachineId { get; set; }
    public Guid? EmployeeId { get; set; }
    public ProductionEventType EventType { get; set; }
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}

// Advanced Reports DTOs
public class ProductionOperationsSummaryDto
{
    public int TotalWorkCenters { get; set; }
    public int ActiveMachines { get; set; }
    public int MaintenanceMachines { get; set; }
    public int ActiveRoutings { get; set; }
    public int ScheduledOrders { get; set; }
    public int InProgressSchedules { get; set; }
    public int ActiveWorkerAssignments { get; set; }
    public int DowntimeEventsCount { get; set; }
    public List<WorkCenterWorkloadDto> WorkCenterWorkload { get; set; } = new();
    public List<MachineUtilizationDto> MachineStatusBreakdown { get; set; } = new();
}

public class WorkCenterWorkloadDto
{
    public string WorkCenterCode { get; set; } = string.Empty;
    public string WorkCenterName { get; set; } = string.Empty;
    public int ScheduledJobsCount { get; set; }
    public decimal TotalCapacity { get; set; }
}

public class MachineUtilizationDto
{
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int EventsLoggedCount { get; set; }
}
