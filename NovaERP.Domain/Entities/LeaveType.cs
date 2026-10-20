using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class LeaveType : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DefaultDaysPerYear { get; set; } = 12;
    public bool IsActive { get; set; } = true;
}
