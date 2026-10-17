using NovaERP.Application.Features.Permissions.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace NovaERP.Application.Interfaces.Services
{
    public interface IPermissionService
    {
        Task<NovaERP.Application.Common.Models.PagedResult<PermissionDto>> GetAllPermissionsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);
        Task<IEnumerable<PermissionDto>> GetRolePermissionsAsync(Guid roleId);
        Task AssignPermissionsToRoleAsync(Guid roleId, List<Guid> permissionIds);
        Task<IEnumerable<PermissionGroupDto>> GetPermissionsGroupedByModuleAsync();
    }
}
