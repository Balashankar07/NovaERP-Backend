using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class Department : AuditableEntity
{
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ManagerUserId { get; set; }
    public User? ManagerUser { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<EmployeeProfile> Employees { get; set; } = new List<EmployeeProfile>();
}
