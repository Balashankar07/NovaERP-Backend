using NovaERP.Application.Common.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using NovaERP.Application.Features.Users.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;

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
            Items = pagedResult.Items.Select(u => new UserDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Phone = u.Phone,
                CompanyId = u.CompanyId,
                RoleIds = u.UserRoles?.Select(ur => ur.RoleId).ToList() ?? new List<Guid>(),
                IsActive = u.IsActive
            }),
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

        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.Phone,
            CompanyId = user.CompanyId,
            RoleIds = user.UserRoles?.Select(ur => ur.RoleId).ToList() ?? new List<Guid>(),
            IsActive = user.IsActive
        };
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        var user = new User
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = _passwordHasher.HashPassword(dto.Password),
            CompanyId = dto.CompanyId,
            UserRoles = dto.RoleIds?.Select(id => new UserRole { RoleId = id }).ToList() ?? new List<UserRole>(),
            IsActive = true
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "User", user.Id.ToString(), newValues: $"Email: {user.Email}, RoleIds: {string.Join(',', dto.RoleIds ?? new List<Guid>())}");

        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.Phone,
            CompanyId = user.CompanyId,
            RoleIds = dto.RoleIds ?? new List<Guid>(),
            IsActive = user.IsActive
        };
    }

    public async Task UpdateAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);

        if (user == null)
            throw new ArgumentException("User not found.");

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Phone = dto.Phone;
        user.CompanyId = dto.CompanyId;
        
        user.UserRoles ??= new List<UserRole>();
        user.UserRoles.Clear();
        if (dto.RoleIds != null)
        {
            foreach (var roleId in dto.RoleIds)
            {
                user.UserRoles.Add(new UserRole { RoleId = roleId });
            }
        }
        
        user.IsActive = dto.IsActive;
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

        _unitOfWork.Users.Delete(user);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "User", user.Id.ToString());
    }
}