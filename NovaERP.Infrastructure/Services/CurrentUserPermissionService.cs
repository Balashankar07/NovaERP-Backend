using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.Infrastructure.Services;

/// <summary>
/// Resolves whether the current user's role carries a named permission
/// by querying the stateless permissions baked into the JWT claims.
/// </summary>
public class CurrentUserPermissionService : ICurrentUserPermissionService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<CurrentUserPermissionService> _logger;

    public CurrentUserPermissionService(
        ICurrentUserService currentUserService,
        ILogger<CurrentUserPermissionService> logger)
    {
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public Task<bool> HasPermissionAsync(string permissionName)
    {
        if (!_currentUserService.IsAuthenticated)
        {
            _logger.LogDebug("HasPermissionAsync: user is not authenticated.");
            return Task.FromResult(false);
        }

        // Super Admin role has full master access across all modules
        if (_currentUserService.Role?.Equals("Super Admin", StringComparison.OrdinalIgnoreCase) == true)
        {
            return Task.FromResult(true);
        }

        var hasPermission = _currentUserService.Permissions
            .Any(p => string.Equals(p, permissionName, StringComparison.OrdinalIgnoreCase));

        _logger.LogDebug(
            "HasPermissionAsync: User {UserId} / Permission '{Permission}' -> {Result}",
            _currentUserService.UserId, permissionName, hasPermission);

        return Task.FromResult(hasPermission);
    }

    public Task<List<string>> GetUserPermissionsAsync()
    {
        if (!_currentUserService.IsAuthenticated)
        {
            return Task.FromResult(new List<string>());
        }

        return Task.FromResult(_currentUserService.Permissions.ToList());
    }
}
