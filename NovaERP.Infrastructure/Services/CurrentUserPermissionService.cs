using Microsoft.Extensions.Logging;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.Infrastructure.Services;

/// <summary>
/// Resolves whether the current user's role carries a named permission
/// by querying the existing RolePermission and Permission tables.
/// </summary>
public class CurrentUserPermissionService : ICurrentUserPermissionService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CurrentUserPermissionService> _logger;

    public CurrentUserPermissionService(
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        ILogger<CurrentUserPermissionService> logger)
    {
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<bool> HasPermissionAsync(string permissionName)
    {
        if (!_currentUserService.IsAuthenticated)
        {
            _logger.LogDebug("HasPermissionAsync: user is not authenticated.");
            return false;
        }

        var userId = _currentUserService.UserId;

        if (userId == Guid.Empty)
        {
            _logger.LogWarning("HasPermissionAsync: UserId claim is empty.");
            return false;
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId);

        if (user is null)
        {
            _logger.LogWarning("HasPermissionAsync: User {UserId} not found.", userId);
            return false;
        }

        var roleIds = user.UserRoles?.Select(ur => ur.RoleId).ToList() ?? new List<Guid>();

        if (!roleIds.Any())
        {
            _logger.LogDebug("HasPermissionAsync: User {UserId} has no roles assigned.", userId);
            return false;
        }

        var allRolePermissions = await _unitOfWork.RolePermissions.GetAllAsync(1, int.MaxValue);
        var permissionIds = allRolePermissions.Items
            .Where(rp => roleIds.Contains(rp.RoleId))
            .Select(rp => rp.PermissionId)
            .ToHashSet();

        if (permissionIds.Count == 0)
        {
            _logger.LogDebug(
                "HasPermissionAsync: Roles {RoleIds} have no permissions assigned.", string.Join(',', roleIds));
            return false;
        }

        var allPermissions = await _unitOfWork.Permissions.GetAllAsync(1, int.MaxValue);
        var hasPermission = allPermissions.Items
            .Any(p => permissionIds.Contains(p.Id)
                   && string.Equals(p.Name, permissionName, StringComparison.OrdinalIgnoreCase));

        _logger.LogDebug(
            "HasPermissionAsync: User {UserId} / Roles {RoleIds} / Permission '{Permission}' -> {Result}",
            userId, string.Join(',', roleIds), permissionName, hasPermission);

        return hasPermission;
    }

    public async Task<List<string>> GetUserPermissionsAsync()
    {
        if (!_currentUserService.IsAuthenticated)
        {
            return new List<string>();
        }

        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
        {
            return new List<string>();
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
        {
            return new List<string>();
        }

        var roleIds = user.UserRoles?.Select(ur => ur.RoleId).ToList() ?? new List<Guid>();

        if (!roleIds.Any())
        {
            return new List<string>();
        }

        var allRolePermissions = await _unitOfWork.RolePermissions.GetAllAsync(1, int.MaxValue);
        var permissionIds = allRolePermissions.Items
            .Where(rp => roleIds.Contains(rp.RoleId))
            .Select(rp => rp.PermissionId)
            .ToHashSet();

        if (permissionIds.Count == 0)
        {
            return new List<string>();
        }

        var allPermissions = await _unitOfWork.Permissions.GetAllAsync(1, int.MaxValue);
        var userPermissions = allPermissions.Items
            .Where(p => permissionIds.Contains(p.Id))
            .Select(p => p.Name)
            .ToList();

        return userPermissions;
    }
}
