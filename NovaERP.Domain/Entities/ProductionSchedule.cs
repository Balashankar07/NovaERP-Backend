using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ProductionSchedule : AuditableEntity
{
    public Guid ProductionOrderId { get; set; }
    public ProductionOrder ProductionOrder { get; set; } = null!;

    public Guid? OperationId { get; set; }
    public ProductionRoutingOperation? Operation { get; set; }

    public Guid WorkCenterId { get; set; }
    public WorkCenter WorkCenter { get; set; } = null!;

    public Guid? MachineId { get; set; }
    public Machine? Machine { get; set; }

    public DateTime PlannedStart { get; set; }
    public DateTime PlannedEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }

    public ScheduleStatus Status { get; set; } = ScheduleStatus.Planned;
    public string? Remarks { get; set; }
}
