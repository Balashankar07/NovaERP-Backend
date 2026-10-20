using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class Machine : AuditableEntity
{
    public string MachineCode { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;

    public Guid WorkCenterId { get; set; }
    public WorkCenter WorkCenter { get; set; } = null!;

    public string MachineType { get; set; } = "Standard";
    public MachineStatus Status { get; set; } = MachineStatus.Available;

    public decimal Capacity { get; set; } = 1.0m;
    public string? Location { get; set; }
    public bool IsActive { get; set; } = true;
}
