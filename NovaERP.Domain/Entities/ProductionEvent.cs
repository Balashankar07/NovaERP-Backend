using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ProductionEvent : AuditableEntity
{
    public Guid ProductionExecutionId { get; set; }
    public ProductionExecution ProductionExecution { get; set; } = null!;

    public Guid? MachineId { get; set; }
    public Machine? Machine { get; set; }

    public Guid? EmployeeId { get; set; }
    public EmployeeProfile? Employee { get; set; }

    public ProductionEventType EventType { get; set; } = ProductionEventType.Other;

    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }

    public string Reason { get; set; } = string.Empty;
    public string? Remarks { get; set; }
}
