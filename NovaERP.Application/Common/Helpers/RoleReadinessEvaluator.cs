using System;
using System.Collections.Generic;

namespace NovaERP.Application.Common.Helpers;

public class RoleReadinessInfo
{
    public bool IsOperationallyReady { get; set; }
    public string ReadinessReason { get; set; } = string.Empty;
    public string DashboardRoute { get; set; } = string.Empty;
    public string ModuleKey { get; set; } = string.Empty;
}

public static class RoleReadinessEvaluator
{
    private static readonly Dictionary<string, RoleReadinessInfo> _readinessMap = new(StringComparer.OrdinalIgnoreCase)
    {
        // Operational Roles
        { "System Administrator", new RoleReadinessInfo { IsOperationallyReady = true, ReadinessReason = "Operational", DashboardRoute = "/administration", ModuleKey = "Administration" } },
        { "Procurement Manager", new RoleReadinessInfo { IsOperationallyReady = true, ReadinessReason = "Operational", DashboardRoute = "/procurement", ModuleKey = "Procurement" } },
        { "Warehouse Manager", new RoleReadinessInfo { IsOperationallyReady = true, ReadinessReason = "Operational", DashboardRoute = "/inventory", ModuleKey = "Inventory/Warehouse" } },
        { "Production Manager", new RoleReadinessInfo { IsOperationallyReady = true, ReadinessReason = "Operational", DashboardRoute = "/production", ModuleKey = "Production" } },

        // Non-Operational / Future Roles
        { "Quality Engineer", new RoleReadinessInfo { IsOperationallyReady = false, ReadinessReason = "Quality Control module incomplete", DashboardRoute = "", ModuleKey = "Quality" } },
        { "Sales Manager", new RoleReadinessInfo { IsOperationallyReady = false, ReadinessReason = "Sales module incomplete", DashboardRoute = "", ModuleKey = "Sales" } },
        { "Finance Manager", new RoleReadinessInfo { IsOperationallyReady = false, ReadinessReason = "Finance workflow incomplete", DashboardRoute = "", ModuleKey = "Finance" } },
        { "Warranty Executive", new RoleReadinessInfo { IsOperationallyReady = false, ReadinessReason = "Warranty module incomplete", DashboardRoute = "", ModuleKey = "Warranty" } },
        { "Distributor", new RoleReadinessInfo { IsOperationallyReady = false, ReadinessReason = "Distribution workflow incomplete", DashboardRoute = "", ModuleKey = "Distribution" } }
    };

    public static IEnumerable<string> GetOperationalRoleNames()
    {
        return _readinessMap.Where(x => x.Value.IsOperationallyReady).Select(x => x.Key);
    }

    /// <summary>
    /// Evaluates if a role is operationally ready. Legacy roles not explicitly mapped are treated as NOT ready.
    /// </summary>
    public static RoleReadinessInfo Evaluate(string roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
            return new RoleReadinessInfo { IsOperationallyReady = false, ReadinessReason = "Unknown role", DashboardRoute = "", ModuleKey = "" };

        if (_readinessMap.TryGetValue(roleName, out var info))
        {
            return info;
        }

        // Default for legacy/unknown roles
        return new RoleReadinessInfo
        {
            IsOperationallyReady = false,
            ReadinessReason = "Legacy or unsupported role",
            DashboardRoute = "",
            ModuleKey = ""
        };
    }
}
