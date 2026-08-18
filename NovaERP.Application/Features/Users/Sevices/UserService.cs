using NovaERP.Application.Common.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using NovaERP.Application.Features.Users.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Application.Common.Helpers;

namespace NovaERP.Application.Features.Users.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditLogger _auditLogger;

    public UserService(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IAuditLogger auditLogger)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _auditLogger = auditLogger;
    }

    public async Task<PagedResult<UserDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var pagedResult = await _unitOfWork.Users.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return new PagedResult<UserDto>
        {
            Items = pagedResult.Items.Select(u => MapToDto(u)),
            TotalCount = pagedResult.TotalCount,
            PageNumber = pagedResult.PageNumber,
            PageSize = pagedResult.PageSize
        };
    }

    public async Task<UserDto?> GetByIdAsync(Guid id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);

        if (user == null)
            return null;

        return MapToDto(user);
    }

    private UserDto MapToDto(User u)
    {
        return new UserDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Email = u.Email,
            Phone = u.Phone,
            CompanyId = u.CompanyId,
            RoleIds = u.UserRoles?.Select(ur => ur.RoleId).ToList() ?? new List<Guid>(),
            IsActive = u.IsActive,
            GoogleSubjectLinked = !string.IsNullOrWhiteSpace(u.GoogleSubjectId),
            AssignedRoles = u.UserRoles?.Select(ur => 
            {
                var roleName = ur.Role?.Name ?? "Unknown";
                var readiness = RoleReadinessEvaluator.Evaluate(roleName);
                return new UserAssignedRoleDto
                {
                    RoleId = ur.RoleId,
                    RoleName = roleName,
                    IsOperationallyReady = readiness.IsOperationallyReady,
                    ReadinessReason = readiness.ReadinessReason,
                    DashboardRoute = readiness.DashboardRoute
                };
            }).ToList() ?? new List<UserAssignedRoleDto>()
        };
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        var existingUser = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        if (existingUser != null)
            throw new InvalidOperationException("A user with this email already exists.");

        if (dto.RoleIds != null && dto.RoleIds.Any())
        {
            foreach (var roleId in dto.RoleIds)
            {
                var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
                if (role == null || !role.IsActive)
                    throw new ArgumentException($"Role with ID {roleId} is invalid or inactive.");

                var readiness = RoleReadinessEvaluator.Evaluate(role.Name);
                if (!readiness.IsOperationallyReady)
                {
                    throw new InvalidOperationException($"Role '{role.Name}' is not yet operational and cannot be assigned to new users. Reason: {readiness.ReadinessReason}");
                }
            }
        }

        var user = new User
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = normalizedEmail,
            Phone = dto.Phone,
            // Password is no longer actively used since Google auth is enforced,
            // but we hash whatever is provided (or a random string) to satisfy DB constraints.
            PasswordHash = _passwordHasher.HashPassword(string.IsNullOrWhiteSpace(dto.Password) ? Guid.NewGuid().ToString() : dto.Password),
            CompanyId = dto.CompanyId,
            UserRoles = dto.RoleIds?.Select(id => new UserRole { RoleId = id }).ToList() ?? new List<UserRole>(),
            IsActive = true
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "User", user.Id.ToString(), newValues: $"Email: {user.Email}, RoleIds: {string.Join(',', dto.RoleIds ?? new List<Guid>())}");

        // Fetch back to get full navigation properties if needed, or map locally
        return MapToDto(user);
    }

    public async Task UpdateAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);

        if (user == null)
            throw new ArgumentException("User not found.");

        if (user.Email.ToLowerInvariant() == "balashankar07@gmail.com" && !dto.IsActive)
            throw new InvalidOperationException("Cannot deactivate the Super Admin user.");

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Phone = dto.Phone;
        user.CompanyId = dto.CompanyId;
        
        user.UserRoles ??= new List<UserRole>();
        
        // Find existing role assignments to allow keeping non-operational roles
        var existingRoleIds = user.UserRoles.Select(ur => ur.RoleId).ToHashSet();
        
        user.UserRoles.Clear();
        if (dto.RoleIds != null)
        {
            foreach (var roleId in dto.RoleIds)
            {
                // Only validate readiness if it's a NEWly assigned role
                if (!existingRoleIds.Contains(roleId))
                {
                    var role = await _unitOfWork.Roles.GetByIdAsync(roleId);
                    if (role == null || !role.IsActive)
                        throw new ArgumentException($"Role with ID {roleId} is invalid or inactive.");

                    var readiness = RoleReadinessEvaluator.Evaluate(role.Name);
                    if (!readiness.IsOperationallyReady)
                    {
                        throw new InvalidOperationException($"Role '{role.Name}' is not yet operational and cannot be newly assigned. Reason: {readiness.ReadinessReason}");
                    }
                }
                
                user.UserRoles.Add(new UserRole { RoleId = roleId });
            }
        }
        
        user.IsActive = dto.IsActive;
        if (dto.GoogleSubjectId != null)
        {
            user.GoogleSubjectId = dto.GoogleSubjectId;
        }
        
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "User", user.Id.ToString());
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);

        if (user == null)
            throw new ArgumentException("User not found.");

        if (user.Email.ToLowerInvariant() == "balashankar07@gmail.com")
            throw new InvalidOperationException("Cannot delete the Super Admin user.");

        _unitOfWork.Users.Delete(user);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "User", user.Id.ToString());
    }
}