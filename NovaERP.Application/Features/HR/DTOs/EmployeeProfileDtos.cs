using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.HR.DTOs;

public class EmployeeProfileDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; }
    public EmploymentStatus Status { get; set; }
    public DateTime DateOfJoining { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContact { get; set; }
    public decimal BaseSalary { get; set; }
    public string? BankName { get; set; }
    public string? AccountNumber { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateEmployeeProfileDto
{
    public Guid UserId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public string Designation { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; } = EmploymentType.FullTime;
    public DateTime DateOfJoining { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContact { get; set; }
    public decimal BaseSalary { get; set; }
    public string? BankName { get; set; }
    public string? AccountNumber { get; set; }
}

public class UpdateEmployeeProfileDto
{
    public Guid DepartmentId { get; set; }
    public string Designation { get; set; } = string.Empty;
    public EmploymentType EmploymentType { get; set; }
    public EmploymentStatus Status { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContact { get; set; }
    public decimal BaseSalary { get; set; }
    public string? BankName { get; set; }
    public string? AccountNumber { get; set; }
}
