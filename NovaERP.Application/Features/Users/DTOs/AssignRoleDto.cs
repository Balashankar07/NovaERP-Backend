namespace NovaERP.Application.Features.Users.DTOs;

public class AssignRoleDto
{
    public Guid UserId { get; set; }
    public List<Guid> RoleIds { get; set; } = new List<Guid>();
}
