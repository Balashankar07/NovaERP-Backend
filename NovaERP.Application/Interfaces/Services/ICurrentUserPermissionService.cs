namespace NovaERP.Application.Interfaces.Services;

/// <summary>
/// Provides permission check capabilities for the currently authenticated user.
/// </summary>
public interface ICurrentUserPermissionService
{
    /// <summary>
    /// Returns true if the current user's role has the specified permission.
    /// </summary>
    /// <param name="permissionName">
    /// The permission name to check (e.g. "Users.Create").
    /// </param>
    Task<bool> HasPermissionAsync(string permissionName);

    /// <summary>
    /// Returns a list of all permission names assigned to the current user's role.
    /// </summary>
    Task<List<string>> GetUserPermissionsAsync();
}
