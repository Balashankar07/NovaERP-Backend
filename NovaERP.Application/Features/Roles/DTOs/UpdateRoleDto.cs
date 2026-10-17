namespace NovaERP.Application.Features.Roles.DTOs;

public class UpdateRoleDto
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public List<Guid>? PermissionIds { get; set; }
}