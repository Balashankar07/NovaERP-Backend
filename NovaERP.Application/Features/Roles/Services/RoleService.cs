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

    public async Task<PagedResult<RoleDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
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
}