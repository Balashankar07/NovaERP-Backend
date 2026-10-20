using System.Collections.Generic;

namespace NovaERP.Application.Features.Permissions.DTOs;

public class PermissionGroupDto
{
    public string Module { get; set; } = string.Empty;
    public List<PermissionDto> Permissions { get; set; } = new List<PermissionDto>();
}
