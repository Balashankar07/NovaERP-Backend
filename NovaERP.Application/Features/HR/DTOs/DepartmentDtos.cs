namespace NovaERP.Application.Features.HR.DTOs;

public class DepartmentDto
{
    public Guid Id { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ManagerUserId { get; set; }
    public string? ManagerUserName { get; set; }
    public bool IsActive { get; set; }
    public int EmployeeCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDepartmentDto
{
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ManagerUserId { get; set; }
}

public class UpdateDepartmentDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ManagerUserId { get; set; }
    public bool IsActive { get; set; }
}
