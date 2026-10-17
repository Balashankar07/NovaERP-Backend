namespace NovaERP.Application.Features.Roles.DTOs;

public class RoleDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; }
    
    public List<NovaERP.Application.Features.Permissions.DTOs.PermissionDto> AssignedPermissions { get; set; } = new List<NovaERP.Application.Features.Permissions.DTOs.PermissionDto>();
}