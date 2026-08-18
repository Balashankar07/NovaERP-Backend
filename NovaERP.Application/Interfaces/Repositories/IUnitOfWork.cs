using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IUnitOfWork
{
    IUserRepository Users { get; }

    IRoleRepository Roles { get; }

    ICompanyRepository Companies { get; }

    IPermissionRepository Permissions { get; }

    IRolePermissionRepository RolePermissions { get; }

    IAuditLogRepository AuditLogs { get; }

    IProductCategoryRepository ProductCategories { get; }

    IBrandRepository Brands { get; }

    IUnitRepository Units { get; }

    IProductRepository Products { get; }

    IBOMRepository BOMs { get; }

    IBOMItemRepository BOMItems { get; }

    ISupplierRepository Suppliers { get; }
    ISupplierProductRepository SupplierProducts { get; }

    IPurchaseOrderRepository PurchaseOrders { get; }
    IPurchaseRequestRepository PurchaseRequests { get; }

    IGoodsReceiptRepository GoodsReceipts { get; }
    
    IWarehouseRepository Warehouses { get; }
    IWarehouseLocationRepository WarehouseLocations { get; }

    IInventoryRepository Inventories { get; }
    IInventoryTransactionRepository InventoryTransactions { get; }
    IProductionPlanRepository ProductionPlans { get; }
    IProductionOrderRepository ProductionOrders { get; }
    IProductionOrderRequirementRepository ProductionOrderRequirements { get; }
    IProductionExecutionRepository ProductionExecutions { get; }
    IInventoryReservationRepository InventoryReservations { get; }
    IMaterialConsumptionRepository MaterialConsumptions { get; }
    IQualityInspectionRepository QualityInspections { get; }
    ISalesOrderRepository SalesOrders { get; }
    IShipmentRepository Shipments { get; }
    IRepository<Distributor> Distributors { get; }
    IWarrantyRepository Warranties { get; }
    IWarrantyClaimRepository WarrantyClaims { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}