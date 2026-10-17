using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Roles.DTOs;
using NovaERP.Application.Features.Users.DTOs;
using NovaERP.Application.Features.Permissions.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace NovaERP.Application.Interfaces.Services;

public interface IRoleService
{
    Task<PagedResult<RoleDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);

    Task<RoleDto?> GetByIdAsync(Guid id);

    Task<RoleDto> CreateAsync(CreateRoleDto dto);

    Task UpdateAsync(Guid id, UpdateRoleDto dto);

    Task DeleteAsync(Guid id);

    Task BulkDeleteAsync(IEnumerable<Guid> ids);

    Task ActivateAsync(Guid id);

    Task DeactivateAsync(Guid id);

    Task<IEnumerable<UserDto>> GetAssignedUsersAsync(Guid roleId);

    Task<IEnumerable<PermissionDto>> GetAssignedPermissionsAsync(Guid roleId);

    Task AssignPermissionsAsync(Guid roleId, AssignPermissionDto dto);

    Task RemovePermissionAsync(Guid roleId, Guid permissionId);
}