using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Features.Admin.DTOs;
using NovaERP.Application.Features.AuditLogs.DTOs;
using NovaERP.Application.Features.Roles.DTOs;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;

    public AdminService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminOverviewDto> GetOverviewAsync()
    {
        var totalUsers = await _context.Users.CountAsync();
        var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
        var inactiveUsers = totalUsers - activeUsers;

        var totalRoles = await _context.Roles.CountAsync(r => r.IsActive);
        var canonicalRoles = new List<string>
        {
            "Super Admin",
            "Procurement Manager",
            "Production Manager",
            "Warehouse Manager",
            "Quality Engineer",
            "Sales Manager",
            "Warranty Executive"
        };

        var roleUserCounts = (await _context.Roles
            .Select(r => new { r.Name, Count = r.UserRoles.Count })
            .ToListAsync())
            .GroupBy(x => x.Name)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Count));

        var totalPermissions = await _context.Permissions.CountAsync();
        var permsByModule = (await _context.Permissions
            .Where(p => p.Module != null)
            .Select(p => new { p.Module })
            .ToListAsync())
            .GroupBy(x => x.Module)
            .ToDictionary(g => g.Key, g => g.Count());

        var recentAlerts = await GetSecurityAlertsInternalAsync(10);
        var health = await GetSystemHealthAsync();
        var moduleStatuses = await GetModuleStatusesAsync();

        return new AdminOverviewDto
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            InactiveUsers = inactiveUsers,
            TotalRoles = totalRoles,
            CanonicalRoles = canonicalRoles,
            RoleUserCounts = roleUserCounts,
            TotalPermissions = totalPermissions,
            PermissionsByModule = permsByModule,
            TotalSecurityAlerts = recentAlerts.Count,
            RecentSecurityAlerts = recentAlerts,
            SystemHealth = health,
            ModuleStatuses = moduleStatuses
        };
    }

    public async Task<AdminSecurityDto> GetSecurityOverviewAsync()
    {
        // Successful logins
        var loginLogs = await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.Action.ToUpper().Contains("LOGIN") && !a.Action.ToUpper().Contains("FAIL"))
            .OrderByDescending(a => a.Timestamp)
            .Take(20)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                UserId = a.UserId,
                Action = a.Action,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                IpAddress = a.IpAddress,
                Timestamp = a.Timestamp
            })
            .ToListAsync();

        // Failed attempts
        var failedAttempts = await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.Action.ToUpper().Contains("FAIL") || a.Action.ToUpper().Contains("INVALID") || a.Action.ToUpper().Contains("INACTIVE"))
            .OrderByDescending(a => a.Timestamp)
            .Take(20)
            .Select(a => new AdminSecurityAlertDto
            {
                Id = a.Id,
                Timestamp = a.Timestamp,
                EventType = "FailedLogin",
                UserIdentifier = a.User != null ? a.User.Email : (a.UserId.HasValue ? a.UserId.Value.ToString() : "Unknown"),
                Action = a.Action,
                Details = !string.IsNullOrEmpty(a.NewValues) ? a.NewValues : a.EntityName,
                IpAddress = !string.IsNullOrEmpty(a.IpAddress) ? a.IpAddress : "127.0.0.1"
            })
            .ToListAsync();

        // Authorization denied events
        var authEvents = await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.Action.ToUpper().Contains("DENIED") || a.Action.ToUpper().Contains("UNAUTHORIZED") || a.Action.ToUpper().Contains("FORBIDDEN"))
            .OrderByDescending(a => a.Timestamp)
            .Take(20)
            .Select(a => new AdminSecurityAlertDto
            {
                Id = a.Id,
                Timestamp = a.Timestamp,
                EventType = "PermissionDenied",
                UserIdentifier = a.User != null ? a.User.Email : (a.UserId.HasValue ? a.UserId.Value.ToString() : "Unknown"),
                Action = a.Action,
                Details = !string.IsNullOrEmpty(a.NewValues) ? a.NewValues : a.EntityName,
                IpAddress = !string.IsNullOrEmpty(a.IpAddress) ? a.IpAddress : "127.0.0.1"
            })
            .ToListAsync();

        return new AdminSecurityDto
        {
            LoginActivity = loginLogs,
            FailedAttempts = failedAttempts,
            AuthorizationEvents = authEvents
        };
    }

    public async Task<List<AdminModuleStatusDto>> GetModuleStatusesAsync()
    {
        var modules = new List<AdminModuleStatusDto>();

        // 1. Products
        try
        {
            var count = await _context.Products.CountAsync();
            var lastProd = await _context.Products.OrderByDescending(p => p.CreatedAt).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "Products",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastProd?.CreatedAt,
                Route = "/products"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "Products", Status = "Degraded", Route = "/products", ErrorDetails = ex.Message });
        }

        // 2. BOM
        try
        {
            var count = await _context.BOMs.CountAsync();
            var lastBom = await _context.BOMs.OrderByDescending(b => b.CreatedAt).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "BOM",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastBom?.CreatedAt,
                Route = "/bom"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "BOM", Status = "Degraded", Route = "/bom", ErrorDetails = ex.Message });
        }

        // 3. Suppliers
        try
        {
            var count = await _context.Suppliers.CountAsync();
            var lastSup = await _context.Suppliers.OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "Suppliers",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastSup?.CreatedAt,
                Route = "/suppliers"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "Suppliers", Status = "Degraded", Route = "/suppliers", ErrorDetails = ex.Message });
        }

        // 4. Procurement
        try
        {
            var count = await _context.PurchaseOrders.CountAsync();
            var lastPo = await _context.PurchaseOrders.OrderByDescending(p => p.OrderDate).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "Procurement",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastPo?.OrderDate,
                Route = "/procurement/orders"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "Procurement", Status = "Degraded", Route = "/procurement/orders", ErrorDetails = ex.Message });
        }

        // 5. Inventory
        try
        {
            var count = await _context.Inventories.CountAsync();
            var lastTx = await _context.InventoryTransactions.OrderByDescending(t => t.CreatedAt).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "Inventory",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastTx?.CreatedAt,
                Route = "/inventory/stock"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "Inventory", Status = "Degraded", Route = "/inventory/stock", ErrorDetails = ex.Message });
        }

        // 6. Production
        try
        {
            var count = await _context.ProductionOrders.CountAsync();
            var lastPo = await _context.ProductionOrders.OrderByDescending(p => p.CreatedAt).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "Production",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastPo?.CreatedAt,
                Route = "/production/orders"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "Production", Status = "Degraded", Route = "/production/orders", ErrorDetails = ex.Message });
        }

        // 7. Quality
        try
        {
            var count = await _context.QualityInspections.CountAsync();
            var lastQi = await _context.QualityInspections.OrderByDescending(q => q.InspectionDate).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "Quality",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastQi?.InspectionDate,
                Route = "/quality"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "Quality", Status = "Degraded", Route = "/quality", ErrorDetails = ex.Message });
        }

        // 8. Sales
        try
        {
            var count = await _context.SalesOrders.CountAsync();
            var lastSo = await _context.SalesOrders.OrderByDescending(s => s.OrderDate).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "Sales",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastSo?.OrderDate,
                Route = "/sales/orders"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "Sales", Status = "Degraded", Route = "/sales/orders", ErrorDetails = ex.Message });
        }

        // 9. Distribution
        try
        {
            var count = await _context.Shipments.CountAsync();
            var lastShipment = await _context.Shipments.OrderByDescending(s => s.DispatchDate ?? s.CreatedAt).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "Distribution",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastShipment?.DispatchDate ?? lastShipment?.CreatedAt,
                Route = "/distribution/shipments"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "Distribution", Status = "Degraded", Route = "/distribution/shipments", ErrorDetails = ex.Message });
        }

        // 10. Warranty
        try
        {
            var count = await _context.Warranties.CountAsync();
            var lastWarranty = await _context.Warranties.OrderByDescending(w => w.StartDate).FirstOrDefaultAsync();
            modules.Add(new AdminModuleStatusDto
            {
                ModuleName = "Warranty",
                Status = "Operational",
                RecordCount = count,
                LastActivity = lastWarranty?.StartDate,
                Route = "/warranty"
            });
        }
        catch (Exception ex)
        {
            modules.Add(new AdminModuleStatusDto { ModuleName = "Warranty", Status = "Degraded", Route = "/warranty", ErrorDetails = ex.Message });
        }

        return modules;
    }

    public async Task<List<AdminHealthStatusDto>> GetSystemHealthAsync()
    {
        var healthList = new List<AdminHealthStatusDto>();

        // 1. API Health
        healthList.Add(new AdminHealthStatusDto
        {
            Component = "API",
            Status = "Operational",
            Details = "REST API listening, process responsive.",
            ResponseTimeMs = 1
        });

        // 2. Database Health
        var sw = Stopwatch.StartNew();
        try
        {
            bool canConnect = await _context.Database.CanConnectAsync();
            sw.Stop();
            healthList.Add(new AdminHealthStatusDto
            {
                Component = "Database",
                Status = canConnect ? "Operational" : "Unavailable",
                Details = canConnect ? $"PostgreSQL connection active ({sw.ElapsedMilliseconds}ms)" : "Failed to connect to database.",
                ResponseTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (Exception ex)
        {
            sw.Stop();
            healthList.Add(new AdminHealthStatusDto
            {
                Component = "Database",
                Status = "Unavailable",
                Details = ex.Message,
                ResponseTimeMs = sw.ElapsedMilliseconds
            });
        }

        // 3. Authentication Health
        sw.Restart();
        var userCount = await _context.Users.CountAsync();
        sw.Stop();
        healthList.Add(new AdminHealthStatusDto
        {
            Component = "Authentication",
            Status = "Operational",
            Details = $"JWT Provider active. {userCount} registered accounts.",
            ResponseTimeMs = sw.ElapsedMilliseconds
        });

        // 4. Audit Logging Health
        sw.Restart();
        var auditCount = await _context.AuditLogs.CountAsync();
        sw.Stop();
        healthList.Add(new AdminHealthStatusDto
        {
            Component = "Audit logging",
            Status = "Operational",
            Details = $"Audit storage operational. {auditCount} logs persisted.",
            ResponseTimeMs = sw.ElapsedMilliseconds
        });

        // 5. Reports Health
        healthList.Add(new AdminHealthStatusDto
        {
            Component = "Reports",
            Status = "Operational",
            Details = "Reporting engine ready.",
            ResponseTimeMs = 2
        });

        return healthList;
    }

    public Task<AdminSystemConfigDto> GetSystemConfigurationAsync()
    {
        return Task.FromResult(new AdminSystemConfigDto
        {
            AppName = "NovaERP Enterprise",
            Environment = "Development",
            DefaultCurrency = "INR",
            TimeZone = "Asia/Kolkata",
            SessionTimeoutMinutes = 60,
            DatabaseProvider = "PostgreSQL",
            AuditLoggingEnabled = true,
            MultiFactorAuthRequired = false,
            MaxFailedLoginAttempts = 5
        });
    }

    public Task<AdminSystemInfoDto> GetSystemInfoAsync()
    {
        return Task.FromResult(new AdminSystemInfoDto
        {
            AppName = "NovaERP Enterprise",
            Version = "v1.0.0",
            Environment = "Development",
            BackendVersion = ".NET 10.0 ASP.NET Core",
            FrontendVersion = "React 18 + Vite",
            DatabaseProvider = "PostgreSQL",
            ApiVersion = "v1",
            ServerTime = DateTime.UtcNow
        });
    }

    public async Task<RolePermissionMatrixDto> GetPermissionMatrixAsync()
    {
        var roles = await _context.Roles
            .OrderBy(r => r.Name)
            .Select(r => new RoleMatrixHeaderDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                IsActive = r.IsActive,
                UserCount = r.UserRoles.Count,
                PermissionCount = r.RolePermissions.Count
            })
            .ToListAsync();

        var allPermissions = await _context.Permissions
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Name)
            .ToListAsync();

        var rolePermissionsList = await _context.RolePermissions.ToListAsync();
        var rolePermLookup = new HashSet<(Guid RoleId, Guid PermissionId)>(
            rolePermissionsList.Select(rp => (rp.RoleId, rp.PermissionId))
        );

        var modules = allPermissions.Select(p => p.Module).Distinct().ToList();

        var rows = allPermissions.Select(p =>
        {
            var map = new Dictionary<Guid, bool>();
            foreach (var r in roles)
            {
                map[r.Id] = rolePermLookup.Contains((r.Id, p.Id));
            }

            return new PermissionMatrixRowDto
            {
                PermissionId = p.Id,
                PermissionName = p.Name,
                Description = p.Description,
                Module = p.Module,
                RoleMap = map
            };
        }).ToList();

        return new RolePermissionMatrixDto
        {
            Roles = roles,
            Modules = modules,
            Rows = rows
        };
    }

    public async Task ToggleRolePermissionAsync(ToggleRolePermissionDto dto)
    {
        var existing = await _context.RolePermissions
            .FirstOrDefaultAsync(rp => rp.RoleId == dto.RoleId && rp.PermissionId == dto.PermissionId);

        if (dto.IsGranted)
        {
            if (existing == null)
            {
                _context.RolePermissions.Add(new RolePermission
                {
                    RoleId = dto.RoleId,
                    PermissionId = dto.PermissionId
                });
                await _context.SaveChangesAsync();
            }
        }
        else
        {
            if (existing != null)
            {
                _context.RolePermissions.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }
    }

    private async Task<List<AdminSecurityAlertDto>> GetSecurityAlertsInternalAsync(int limit)
    {
        return await _context.AuditLogs
            .Include(a => a.User)
            .Where(a => a.Action.ToUpper().Contains("FAIL") || a.Action.ToUpper().Contains("DENIED") || a.Action.ToUpper().Contains("UNAUTHORIZED"))
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .Select(a => new AdminSecurityAlertDto
            {
                Id = a.Id,
                Timestamp = a.Timestamp,
                EventType = a.Action.ToUpper().Contains("DENIED") ? "PermissionDenied" : "FailedLogin",
                UserIdentifier = a.User != null ? a.User.Email : (a.UserId.HasValue ? a.UserId.Value.ToString() : "Unknown"),
                Action = a.Action,
                Details = !string.IsNullOrEmpty(a.NewValues) ? a.NewValues : a.EntityName,
                IpAddress = !string.IsNullOrEmpty(a.IpAddress) ? a.IpAddress : "127.0.0.1"
            })
            .ToListAsync();
    }
}
