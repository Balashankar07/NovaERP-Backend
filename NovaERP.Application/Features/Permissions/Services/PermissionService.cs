using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Permissions.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;

namespace NovaERP.Application.Features.Permissions.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAuditLogger _auditLogger;

        public PermissionService(IUnitOfWork unitOfWork, IAuditLogger auditLogger)
        {
            _unitOfWork = unitOfWork;
            _auditLogger = auditLogger;
        }

        public async Task<PagedResult<PermissionDto>> GetAllPermissionsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
        {
            var pagedResult = await _unitOfWork.Permissions.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return new PagedResult<PermissionDto>
        {
            Items = pagedResult.Items.Select(p => new PermissionDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Module = p.Module
            }),
            TotalCount = pagedResult.TotalCount,
            PageNumber = pagedResult.PageNumber,
            PageSize = pagedResult.PageSize
        };
        }

        public async Task<IEnumerable<PermissionDto>> GetRolePermissionsAsync(Guid roleId)
        {
            var allRolePermissions = await _unitOfWork.RolePermissions.GetAllAsync(1, int.MaxValue);
            var rolePermissionIds = allRolePermissions.Items
                .Where(rp => rp.RoleId == roleId)
                .Select(rp => rp.PermissionId)
                .ToList();

            var allPermissions = await _unitOfWork.Permissions.GetAllAsync(1, int.MaxValue);
            var permissions = allPermissions.Items.Where(p => rolePermissionIds.Contains(p.Id));

            return permissions.Select(p => new PermissionDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Module = p.Module
            });
        }

        public async Task AssignPermissionsToRoleAsync(Guid roleId, List<Guid> permissionIds)
        {
            // Verify role exists
            var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
            if (role == null)
            {
                throw new KeyNotFoundException($"Role with ID {roleId} not found.");
            }

            // Get existing role permissions
            var allRolePermissions = await _unitOfWork.RolePermissions.GetAllAsync(1, int.MaxValue);
            var existingRolePermissions = allRolePermissions.Items.Where(rp => rp.RoleId == roleId).ToList();

            // Delete existing
            foreach (var rp in existingRolePermissions)
            {
                _unitOfWork.RolePermissions.Delete(rp);
            }

            // Add new
            foreach (var permissionId in permissionIds)
            {
                var rolePermission = new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = permissionId
                };
                await _unitOfWork.RolePermissions.AddAsync(rolePermission);
            }

            await _unitOfWork.SaveChangesAsync();

            await _auditLogger.LogAsync("Update", "RolePermissions", roleId.ToString(), newValues: $"Permissions assigned: {string.Join(", ", permissionIds)}");
        }

        public async Task<IEnumerable<PermissionGroupDto>> GetPermissionsGroupedByModuleAsync()
        {
            var pagedResult = await _unitOfWork.Permissions.GetAllAsync(1, int.MaxValue);
            
            var grouped = pagedResult.Items
                .GroupBy(p => string.IsNullOrWhiteSpace(p.Module) ? "Other" : p.Module)
                .Select(g => new PermissionGroupDto
                {
                    Module = g.Key,
                    Permissions = g.Select(p => new PermissionDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        Module = p.Module
                    }).OrderBy(p => p.Name).ToList()
                })
                .OrderBy(g => g.Module)
                .ToList();

            return grouped;
        }
    }
}
