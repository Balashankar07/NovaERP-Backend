using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Users.DTOs;
using NovaERP.Application.Features.Roles.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace NovaERP.Application.Interfaces.Services;

public interface IUserService
{
    Task<PagedResult<UserDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);

    Task<UserDto?> GetByIdAsync(Guid id);

    Task<UserDto> CreateAsync(CreateUserDto dto);

    Task UpdateAsync(Guid id, UpdateUserDto dto);

    Task DeleteAsync(Guid id);

    Task BulkDeleteAsync(IEnumerable<Guid> ids);

    Task ActivateAsync(Guid id);

    Task DeactivateAsync(Guid id);

    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);

    Task<IEnumerable<RoleDto>> GetAssignedRolesAsync(Guid userId);

    Task AssignRolesAsync(Guid userId, AssignRoleDto dto);

    Task RemoveRoleAsync(Guid userId, Guid roleId);
}