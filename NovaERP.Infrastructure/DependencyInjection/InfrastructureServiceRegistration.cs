using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MediatR;
using Npgsql;

using NovaERP.Application.Features.Users.Services;
using NovaERP.Application.Interfaces;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Application.Services;

using NovaERP.Infrastructure.Authentication;
using NovaERP.Infrastructure.Identity.JWT;
using NovaERP.Infrastructure.Identity.Security;
using NovaERP.Infrastructure.Persistence.Context;
using NovaERP.Infrastructure.Repositories;
using NovaERP.Infrastructure.Services;
using NovaERP.Application.Features.Roles.Services;
using NovaERP.Application.Features.Dashboard;
using NovaERP.Application.Features.Permissions.Services;
using NovaERP.Application.Features.AuditLogs.Services;

namespace NovaERP.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = ResolveConnectionString(configuration);
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null);
                npgsql.CommandTimeout(60);
            }));

        // Register Infrastructure MediatR handlers (e.g. GoogleSignInCommandHandler)
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssemblyContaining<GoogleSignInCommandHandler>();
        });

        // Repository Registration
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();
        services.AddScoped<IRolePermissionRepository, RolePermissionRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        
        services.AddScoped<IProductCategoryRepository, ProductCategoryRepository>();
        services.AddScoped<IBrandRepository, BrandRepository>();
        services.AddScoped<IUnitRepository, UnitRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IBOMRepository, BOMRepository>();
        services.AddScoped<IBOMItemRepository, BOMItemRepository>();
        services.AddScoped<ISupplierRepository, SupplierRepository>();
        services.AddScoped<ISupplierProductRepository, SupplierProductRepository>();
        services.AddScoped<IPurchaseOrderRepository, PurchaseOrderRepository>();
        services.AddScoped<IPurchaseRequestRepository, PurchaseRequestRepository>();
        services.AddScoped<IProductionOrderRepository, ProductionOrderRepository>();
        services.AddScoped<IProductionExecutionRepository, ProductionExecutionRepository>();
        services.AddScoped<IMaterialConsumptionRepository, MaterialConsumptionRepository>();
        services.AddScoped<IQualityInspectionRepository, QualityInspectionRepository>();
        services.AddScoped<ISalesOrderRepository, SalesOrderRepository>();
        services.AddScoped<IShipmentRepository, ShipmentRepository>();
        services.AddScoped<IWarrantyRepository, WarrantyRepository>();
        services.AddScoped<IWarrantyClaimRepository, WarrantyClaimRepository>();

        // Service Registration
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<ICurrentUserPermissionService, CurrentUserPermissionService>();
        services.AddScoped<IAuditLogger, AuditLogger>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IAdminService, AdminService>();

        services.AddScoped<IProductCategoryService, ProductCategoryService>();
        services.AddScoped<IBrandService, BrandService>();
        services.AddScoped<IUnitService, UnitService>();
        services.AddScoped<IProductService, ProductService>(sp =>
            new ProductService(
                sp.GetRequiredService<IUnitOfWork>(),
                sp.GetRequiredService<IAuditLogger>(),
                sp.GetRequiredService<AppDbContext>()));
        services.AddScoped<IBOMService, BOMService>();
        services.AddScoped<ISupplierService, SupplierService>();
        services.AddScoped<ISupplierProductService, SupplierProductService>();
        services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
        services.AddScoped<IPurchaseRequestService, PurchaseRequestService>();
        services.AddScoped<IGoodsReceiptService, GoodsReceiptService>();
        services.AddScoped<IWarehouseService, WarehouseService>();
        services.AddScoped<IWarehouseLocationService, WarehouseLocationService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IInventoryMovementService, InventoryMovementService>();
        services.AddScoped<IProductionPlanService, ProductionPlanService>();
        services.AddScoped<IProductionOrderService, ProductionOrderService>();
        services.AddScoped<IProductionExecutionService, ProductionExecutionService>();
        services.AddScoped<IQualityInspectionService, QualityInspectionService>();
        services.AddScoped<ISalesOrderService, SalesOrderService>();
        services.AddScoped<IShipmentService, ShipmentService>();
        services.AddScoped<IWarrantyService, WarrantyService>();
        services.AddScoped<IFinanceService, FinanceService>();
        services.AddScoped<IHRService, HRService>();
        services.AddScoped<IWarehouseTraceabilityService, WarehouseTraceabilityService>();
        services.AddScoped<IProductionOperationsService, ProductionOperationsService>();
        services.AddScoped<IQualityComplianceService, QualityComplianceService>();
        services.AddScoped<IReturnsService, ReturnsService>();
        services.AddScoped<ISupplierPerformanceService, SupplierPerformanceService>();
        services.AddScoped<ILogisticsDocumentsService, LogisticsDocumentsService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<NovaERP.Application.Features.Reports.Interfaces.IReportRepository, NovaERP.Infrastructure.Repositories.Reports.ReportRepository>();
        services.AddScoped<NovaERP.Application.Features.Reports.Interfaces.IReportService, NovaERP.Infrastructure.Services.ReportService>();

        // JWT
        services.Configure<JwtSettings>(
            configuration.GetSection("Jwt"));

        services.AddScoped<IJwtService, JwtService>();

        // Password Hashing
        services.AddScoped<IPasswordHasher, PasswordHasher>();

        return services;
    }

    private static string ResolveConnectionString(IConfiguration configuration)
    {
        // 1. Highest priority: DATABASE_URL environment variable from Render / cloud host
        var envDbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrWhiteSpace(envDbUrl) && !envDbUrl.Contains("YOUR_DB_HOST", StringComparison.OrdinalIgnoreCase))
        {
            return ParsePostgresUrlOrConnectionString(envDbUrl);
        }

        // 2. Configuration DATABASE_URL
        var configDbUrl = configuration["DATABASE_URL"];
        if (!string.IsNullOrWhiteSpace(configDbUrl) && !configDbUrl.Contains("YOUR_DB_HOST", StringComparison.OrdinalIgnoreCase))
        {
            return ParsePostgresUrlOrConnectionString(configDbUrl);
        }

        // 3. DefaultConnection from ConnectionStrings
        var defaultConn = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(defaultConn) && !defaultConn.Contains("YOUR_DB_HOST", StringComparison.OrdinalIgnoreCase))
        {
            return ParsePostgresUrlOrConnectionString(defaultConn);
        }

        return string.Empty;
    }

    private static string ParsePostgresUrlOrConnectionString(string conn)
    {
        if (string.IsNullOrWhiteSpace(conn)) return conn;

        conn = conn.Trim().Trim('"').Trim('\'');

        // Auto-convert Render/Heroku postgres:// or postgresql:// URLs into Npgsql standard connection string
        if (conn.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            conn.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(conn);
                var colonIndex = uri.UserInfo.IndexOf(':');
                var user = colonIndex >= 0 ? Uri.UnescapeDataString(uri.UserInfo.Substring(0, colonIndex)) : Uri.UnescapeDataString(uri.UserInfo);
                var pass = colonIndex >= 0 ? Uri.UnescapeDataString(uri.UserInfo.Substring(colonIndex + 1)) : string.Empty;
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var db = uri.AbsolutePath.TrimStart('/');

                return $"Host={host};Port={port};Database={db};Username={user};Password={pass};SSL Mode=Prefer;Trust Server Certificate=true;Timeout=60;Command Timeout=60;";
            }
            catch
            {
                return conn;
            }
        }

        if (!conn.Contains("Trust Server Certificate", StringComparison.OrdinalIgnoreCase))
        {
            conn = conn.TrimEnd(';') + ";Trust Server Certificate=true;";
        }

        return conn;
    }
}
