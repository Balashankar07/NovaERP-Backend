using System;
using System.Collections.Generic;
using NovaERP.Application.Features.AuditLogs.DTOs;
using NovaERP.Application.Features.Roles.DTOs;

namespace NovaERP.Application.Features.Admin.DTOs;

public class AdminOverviewDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }

    public int TotalRoles { get; set; }
    public List<string> CanonicalRoles { get; set; } = new();
    public Dictionary<string, int> RoleUserCounts { get; set; } = new();

    public int TotalPermissions { get; set; }
    public Dictionary<string, int> PermissionsByModule { get; set; } = new();

    public int TotalSecurityAlerts { get; set; }
    public List<AdminSecurityAlertDto> RecentSecurityAlerts { get; set; } = new();

    public List<AdminHealthStatusDto> SystemHealth { get; set; } = new();
    public List<AdminModuleStatusDto> ModuleStatuses { get; set; } = new();
}

public class AdminSecurityAlertDto
{
    public Guid Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; } = string.Empty; // "FailedLogin", "InactiveLoginAttempt", "PermissionDenied"
    public string UserIdentifier { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
}

public class AdminSecurityDto
{
    public List<AuditLogDto> LoginActivity { get; set; } = new();
    public List<AdminSecurityAlertDto> FailedAttempts { get; set; } = new();
    public List<AdminSecurityAlertDto> AuthorizationEvents { get; set; } = new();
}

public class AdminHealthStatusDto
{
    public string Component { get; set; } = string.Empty; // "API", "Database", "Authentication", "Audit logging", "Reports"
    public string Status { get; set; } = "Operational"; // "Operational", "Degraded", "Unavailable"
    public string Details { get; set; } = string.Empty;
    public long ResponseTimeMs { get; set; }
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}

public class AdminModuleStatusDto
{
    public string ModuleName { get; set; } = string.Empty;
    public string Status { get; set; } = "Operational"; // "Operational", "Degraded", "Unavailable"
    public long RecordCount { get; set; }
    public DateTime? LastActivity { get; set; }
    public string Route { get; set; } = string.Empty;
    public string? ErrorDetails { get; set; }
}

public class AdminSystemConfigDto
{
    public string AppName { get; set; } = "NovaERP Enterprise";
    public string Environment { get; set; } = "Development";
    public string DefaultCurrency { get; set; } = "INR";
    public string TimeZone { get; set; } = "Asia/Kolkata";
    public int SessionTimeoutMinutes { get; set; } = 60;
    public string DatabaseProvider { get; set; } = "PostgreSQL";
    public bool AuditLoggingEnabled { get; set; } = true;
    public bool MultiFactorAuthRequired { get; set; } = false;
    public int MaxFailedLoginAttempts { get; set; } = 5;
}

public class AdminSystemInfoDto
{
    public string AppName { get; set; } = "NovaERP Enterprise";
    public string Version { get; set; } = "v1.0.0";
    public string Environment { get; set; } = "Development";
    public string BackendVersion { get; set; } = ".NET 10.0 ASP.NET Core";
    public string FrontendVersion { get; set; } = "React 18 + Vite";
    public string DatabaseProvider { get; set; } = "PostgreSQL";
    public string ApiVersion { get; set; } = "v1";
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;
}

public class RolePermissionMatrixDto
{
    public List<RoleMatrixHeaderDto> Roles { get; set; } = new();
    public List<string> Modules { get; set; } = new();
    public List<PermissionMatrixRowDto> Rows { get; set; } = new();
}

public class RoleMatrixHeaderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int UserCount { get; set; }
    public int PermissionCount { get; set; }
}

public class PermissionMatrixRowDto
{
    public Guid PermissionId { get; set; }
    public string PermissionName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public Dictionary<Guid, bool> RoleMap { get; set; } = new(); // RoleId -> Granted
}

public class ToggleRolePermissionDto
{
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }
    public bool IsGranted { get; set; }
}
