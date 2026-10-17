using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Roles.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;

namespace NovaERP.Application.Features.Roles.Services;

public class RoleService : IRoleService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;

    public RoleService(IUnitOfWork unitOfWork, IAuditLogger auditLogger)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
    }

    public async Task<PagedResult<RoleDto>> GetAllAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder)
    {
        var pagedResult = await _unitOfWork.Roles.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return new PagedResult<RoleDto>
        {
            Items = pagedResult.Items.Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                IsActive = r.IsActive
            }),
            TotalCount = pagedResult.TotalCount,
            PageNumber = pagedResult.PageNumber,
            PageSize = pagedResult.PageSize
        };
    }

    public async Task<RoleDto?> GetByIdAsync(Guid id)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(id);

        if (role == null)
            return null;

        return new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            IsActive = role.IsActive
        };
    }

    public async Task<RoleDto> CreateAsync(CreateRoleDto dto)
    {
        var role = new Role
        {
            Name = dto.Name,
            Description = dto.Description,
            IsActive = true
        };

        if (dto.PermissionIds != null && dto.PermissionIds.Any())
        {
            role.RolePermissions = dto.PermissionIds.Select(id => new RolePermission { PermissionId = id }).ToList();
        }

        await _unitOfWork.Roles.AddAsync(role);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "Role", role.Id.ToString(), newValues: $"Name: {role.Name}");

        return new RoleDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            IsActive = role.IsActive
        };
    }

    public async Task UpdateAsync(Guid id, UpdateRoleDto dto)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(id);

        if (role == null)
            throw new Exception("Role not found.");

        if (role.Name == "Super Admin")
        {
            if (!dto.IsActive)
                throw new InvalidOperationException("Cannot deactivate the Super Admin role.");
            if (dto.Name != "Super Admin")
                throw new InvalidOperationException("Cannot rename the Super Admin role.");
        }

        role.Name = dto.Name;
        role.Description = dto.Description;
        role.IsActive = dto.IsActive;
        role.UpdatedAt = DateTime.UtcNow;

        if (dto.PermissionIds != null)
        {
            role.RolePermissions ??= new List<RolePermission>();
            var existingPerms = role.RolePermissions.Select(rp => rp.PermissionId).ToHashSet();
            role.RolePermissions.Clear();
            foreach (var permId in dto.PermissionIds)
            {
                role.RolePermissions.Add(new RolePermission { PermissionId = permId });
            }
        }

        _unitOfWork.Roles.Update(role);

        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "Role", role.Id.ToString());
    }

    public async Task DeleteAsync(Guid id)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(id);

        if (role == null)
            throw new Exception("Role not found.");

        if (role.Name == "Super Admin")
            throw new InvalidOperationException("Cannot delete the Super Admin role.");

        _unitOfWork.Roles.Delete(role);

        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "Role", role.Id.ToString());
    }

    public async Task BulkDeleteAsync(IEnumerable<Guid> ids)
    {
        foreach (var id in ids)
        {
            var role = await _unitOfWork.Roles.GetByIdAsync(id);
            if (role != null && role.Name != "Super Admin")
            {
                _unitOfWork.Roles.Delete(role);
                await _auditLogger.LogAsync("Delete", "Role", role.Id.ToString());
            }
        }
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ActivateAsync(Guid id)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(id);
        if (role == null) throw new ArgumentException("Role not found.");
        
        role.IsActive = true;
        _unitOfWork.Roles.Update(role);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Activate", "Role", role.Id.ToString());
    }

    public async Task DeactivateAsync(Guid id)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(id);
        if (role == null) throw new ArgumentException("Role not found.");

        if (role.Name == "Super Admin")
            throw new InvalidOperationException("Cannot deactivate the Super Admin role.");

        role.IsActive = false;
        _unitOfWork.Roles.Update(role);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Deactivate", "Role", role.Id.ToString());
    }

    public async Task<IEnumerable<NovaERP.Application.Features.Users.DTOs.UserDto>> GetAssignedUsersAsync(Guid roleId)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
        if (role == null) throw new ArgumentException("Role not found.");

        return role.UserRoles?.Select(ur => new NovaERP.Application.Features.Users.DTOs.UserDto
        {
            Id = ur.User?.Id ?? Guid.Empty,
            FirstName = ur.User?.FirstName ?? string.Empty,
            LastName = ur.User?.LastName ?? string.Empty,
            Email = ur.User?.Email ?? string.Empty,
            Phone = ur.User?.Phone ?? string.Empty,
            CompanyId = ur.User?.CompanyId ?? Guid.Empty,
            IsActive = ur.User?.IsActive ?? false
        }) ?? new List<NovaERP.Application.Features.Users.DTOs.UserDto>();
    }

    public async Task<IEnumerable<NovaERP.Application.Features.Permissions.DTOs.PermissionDto>> GetAssignedPermissionsAsync(Guid roleId)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
        if (role == null) throw new ArgumentException("Role not found.");

        return role.RolePermissions?.Select(rp => new NovaERP.Application.Features.Permissions.DTOs.PermissionDto
        {
            Id = rp.Permission?.Id ?? Guid.Empty,
            Name = rp.Permission?.Name ?? string.Empty,
            Description = rp.Permission?.Description ?? string.Empty,
            Module = rp.Permission?.Module ?? string.Empty
        }) ?? new List<NovaERP.Application.Features.Permissions.DTOs.PermissionDto>();
    }

    public async Task AssignPermissionsAsync(Guid roleId, AssignPermissionDto dto)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
        if (role == null) throw new ArgumentException("Role not found.");

        role.RolePermissions ??= new List<RolePermission>();
        
        foreach (var permissionId in dto.PermissionIds)
        {
            if (!role.RolePermissions.Any(rp => rp.PermissionId == permissionId))
            {
                var permission = await _unitOfWork.Permissions.GetByIdAsync(permissionId);
                if (permission == null)
                    throw new ArgumentException($"Permission with ID {permissionId} is invalid.");

                role.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permissionId });
            }
        }
        
        _unitOfWork.Roles.Update(role);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("AssignPermissions", "Role", role.Id.ToString());
    }

    public async Task RemovePermissionAsync(Guid roleId, Guid permissionId)
    {
        var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
        if (role == null) throw new ArgumentException("Role not found.");

        if (role.RolePermissions != null)
        {
            var permToRemove = role.RolePermissions.FirstOrDefault(rp => rp.PermissionId == permissionId);
            if (permToRemove != null)
            {
                role.RolePermissions.Remove(permToRemove);
                _unitOfWork.Roles.Update(role);
                await _unitOfWork.SaveChangesAsync();
                await _auditLogger.LogAsync("RemovePermission", "Role", role.Id.ToString(), newValues: $"Removed PermissionId: {permissionId}");
            }
        }
    }
}