namespace NovaERP.Application.Features.Roles.DTOs;

public class CreateRoleDto
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public List<Guid>? PermissionIds { get; set; }
}