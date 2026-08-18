using NovaERP.Application.Common.Models;
﻿using NovaERP.Application.Features.Roles.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface IRoleService
{
    Task<PagedResult<RoleDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null, bool? isOperationallyReady = null);

    Task<RoleDto?> GetByIdAsync(Guid id);

    Task<RoleDto> CreateAsync(CreateRoleDto dto);

    Task UpdateAsync(Guid id, UpdateRoleDto dto);

    Task DeleteAsync(Guid id);
}