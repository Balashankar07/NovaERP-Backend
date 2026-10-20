using System;
using System.Collections.Generic;

namespace NovaERP.Application.Features.Roles.DTOs;

public class AssignPermissionDto
{
    public Guid RoleId { get; set; }
    public List<Guid> PermissionIds { get; set; } = new List<Guid>();
}
