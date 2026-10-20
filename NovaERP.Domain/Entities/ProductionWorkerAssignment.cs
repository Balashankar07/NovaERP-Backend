using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class ProductionWorkerAssignment : AuditableEntity
{
    public Guid ProductionExecutionId { get; set; }
    public ProductionExecution ProductionExecution { get; set; } = null!;

    public Guid EmployeeId { get; set; }
    public EmployeeProfile Employee { get; set; } = null!;

    public string RoleOrFunction { get; set; } = "Operator";
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }

    public string Status { get; set; } = "Active";
    public string? Remarks { get; set; }
}
