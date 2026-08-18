namespace NovaERP.Application.Features.Users.DTOs;

public class UserDto
{
    public Guid Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public Guid CompanyId { get; set; }

    public ICollection<Guid> RoleIds { get; set; } = new List<Guid>();

    public bool IsActive { get; set; }
    
    public bool GoogleSubjectLinked { get; set; }

    public ICollection<UserAssignedRoleDto> AssignedRoles { get; set; } = new List<UserAssignedRoleDto>();
}

public class UserAssignedRoleDto
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public bool IsOperationallyReady { get; set; }
    public string ReadinessReason { get; set; } = string.Empty;
    public string DashboardRoute { get; set; } = string.Empty;
}