using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using NovaERP.Domain.Entities;
using NovaERP.Application.Interfaces;

namespace NovaERP.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public IUserRepository Users { get; private set; }
    public IRoleRepository Roles { get; private set; }
    public ICompanyRepository Companies { get; private set; }
    public IPermissionRepository Permissions { get; private set; }
    public IRolePermissionRepository RolePermissions { get; private set; }
    public IAuditLogRepository AuditLogs { get; private set; }

    public IProductCategoryRepository ProductCategories { get; private set; }
    public IBrandRepository Brands { get; private set; }
    public IUnitRepository Units { get; private set; }
    public IProductRepository Products { get; private set; }
    public IBOMRepository BOMs { get; private set; }
    public IBOMItemRepository BOMItems { get; private set; }
    public ISupplierRepository Suppliers { get; private set; }
    public ISupplierProductRepository SupplierProducts { get; private set; }
    public IPurchaseOrderRepository PurchaseOrders { get; private set; }
    public IPurchaseRequestRepository PurchaseRequests { get; private set; }
    public IGoodsReceiptRepository GoodsReceipts { get; private set; }
    public IWarehouseRepository Warehouses { get; private set; }
    public IWarehouseLocationRepository WarehouseLocations { get; private set; }
    public IInventoryRepository Inventories { get; private set; }
    public IInventoryTransactionRepository InventoryTransactions { get; private set; }
    public IProductionPlanRepository ProductionPlans { get; private set; }
    public IProductionOrderRepository ProductionOrders { get; private set; }
    public IProductionOrderRequirementRepository ProductionOrderRequirements { get; private set; }
    public IProductionExecutionRepository ProductionExecutions { get; private set; }
    public IInventoryReservationRepository InventoryReservations { get; private set; }
    public IMaterialConsumptionRepository MaterialConsumptions { get; private set; }
    public IQualityInspectionRepository QualityInspections { get; private set; }
    public ISalesOrderRepository SalesOrders { get; private set; }
    public IRepository<Distributor> Distributors { get; private set; }
    public IShipmentRepository Shipments { get; private set; }
    public IWarrantyRepository Warranties { get; private set; }
    public IWarrantyClaimRepository WarrantyClaims { get; private set; }
    public UnitOfWork(
        AppDbContext context,
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ICompanyRepository companyRepository,
        IPermissionRepository permissionRepository,
        IRolePermissionRepository rolePermissionRepository,
        IAuditLogRepository auditLogRepository,
        IProductCategoryRepository productCategoryRepository,
        IBrandRepository brandRepository,
        IUnitRepository unitRepository,
        IProductRepository productRepository,
        IBOMRepository bomRepository,
        IBOMItemRepository bomItemRepository,
        ISupplierRepository supplierRepository,
        IProductionOrderRepository productionOrderRepository)
    {
        _context = context;
        Users = userRepository;
        Roles = roleRepository;
        Companies = companyRepository;
        Permissions = permissionRepository;
        RolePermissions = rolePermissionRepository;
        AuditLogs = auditLogRepository;

        ProductCategories = productCategoryRepository;
        Brands = brandRepository;
        Units = unitRepository;
        Products = productRepository;
        BOMs = new BOMRepository(_context);
        BOMItems = new BOMItemRepository(_context);
        Suppliers = new SupplierRepository(_context);
        SupplierProducts = new SupplierProductRepository(_context);
        PurchaseOrders = new PurchaseOrderRepository(_context);
        PurchaseRequests = new PurchaseRequestRepository(_context);
        GoodsReceipts = new GoodsReceiptRepository(_context);
        Warehouses = new WarehouseRepository(_context);
        WarehouseLocations = new WarehouseLocationRepository(_context);
        Inventories = new InventoryRepository(_context);
        InventoryTransactions = new InventoryTransactionRepository(_context);
        ProductionPlans = new ProductionPlanRepository(_context);
        ProductionOrders = productionOrderRepository;
        ProductionOrderRequirements = new ProductionOrderRequirementRepository(_context);
        ProductionExecutions = new ProductionExecutionRepository(_context);
        InventoryReservations = new InventoryReservationRepository(_context);
        MaterialConsumptions = new MaterialConsumptionRepository(_context);
        QualityInspections = new QualityInspectionRepository(_context);
        SalesOrders = new SalesOrderRepository(_context);
        Distributors = new Repository<Distributor>(_context);
        Shipments = new ShipmentRepository(_context);
        Warranties = new WarrantyRepository(_context);
        WarrantyClaims = new WarrantyClaimRepository(_context);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync()
    {
        await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
    }

    public async Task CommitTransactionAsync()
    {
        if (_context.Database.CurrentTransaction != null)
        {
            await _context.Database.CurrentTransaction.CommitAsync();
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_context.Database.CurrentTransaction != null)
        {
            await _context.Database.CurrentTransaction.RollbackAsync();
        }
    }
}