using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class EmployeeProfile : AuditableEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string EmployeeCode { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string Designation { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FullTime;
    public EmploymentStatus Status { get; set; } = EmploymentStatus.Active;
    public DateTime DateOfJoining { get; set; }

    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContact { get; set; }

    public decimal BaseSalary { get; set; }
    public string? BankName { get; set; }
    public string? AccountNumber { get; set; }

    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
    public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    public ICollection<PayrollEntry> PayrollEntries { get; set; } = new List<PayrollEntry>();
}
