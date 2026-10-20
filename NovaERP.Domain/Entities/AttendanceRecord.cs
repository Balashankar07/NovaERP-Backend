using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class AttendanceRecord : AuditableEntity
{
    public Guid EmployeeId { get; set; }
    public EmployeeProfile? Employee { get; set; }

    public DateTime AttendanceDate { get; set; }
    public TimeSpan? CheckIn { get; set; }
    public TimeSpan? CheckOut { get; set; }

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public decimal WorkHours { get; set; }
    public string? Remarks { get; set; }
}
