using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MediatR;

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
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection")));

        // Register Infrastructure MediatR handlers (e.g. GoogleSignInCommandHandler)
        // These handlers live in Infrastructure because they depend on Infrastructure packages.
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
}