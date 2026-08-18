using Microsoft.EntityFrameworkCore;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Persistence.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Role> Roles => Set<Role>();

        public DbSet<User> Users => Set<User>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<Company> Companies => Set<Company>();
        public DbSet<Permission> Permissions => Set<Permission>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        
        public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
        public DbSet<Brand> Brands => Set<Brand>();
        public DbSet<Unit> Units => Set<Unit>();
        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<BOM> BOMs { get; set; } = null!;
        public DbSet<BOMItem> BOMItems { get; set; } = null!;
        public DbSet<Supplier> Suppliers { get; set; } = null!;
        public DbSet<SupplierProduct> SupplierProducts { get; set; } = null!;
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; } = null!;
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; } = null!;
        
        public DbSet<PurchaseRequest> PurchaseRequests { get; set; } = null!;
        public DbSet<PurchaseRequestItem> PurchaseRequestItems { get; set; } = null!;
        public DbSet<GoodsReceipt> GoodsReceipts { get; set; } = null!;
        public DbSet<GoodsReceiptItem> GoodsReceiptItems { get; set; } = null!;
        public DbSet<Warehouse> Warehouses { get; set; } = null!;
        public DbSet<WarehouseLocation> WarehouseLocations { get; set; } = null!;
        public DbSet<Inventory> Inventories { get; set; } = null!;
        public DbSet<InventoryTransaction> InventoryTransactions { get; set; } = null!;
        public DbSet<ProductionPlan> ProductionPlans { get; set; } = null!;
        public DbSet<ProductionRequirement> ProductionRequirements { get; set; } = null!;
        public DbSet<ProductionOrder> ProductionOrders { get; set; } = null!;
        public DbSet<ProductionOrderRequirement> ProductionOrderRequirements { get; set; } = null!;
        public DbSet<InventoryReservation> InventoryReservations { get; set; } = null!;
        public DbSet<ProductionExecution> ProductionExecutions { get; set; } = null!;
        public DbSet<MaterialConsumption> MaterialConsumptions { get; set; } = null!;
        public DbSet<QualityInspection> QualityInspections { get; set; } = null!;
        public DbSet<QualityDefect> QualityDefects { get; set; } = null!;

        // Sales Management
        public DbSet<Distributor> Distributors { get; set; } = null!;
        public DbSet<SalesOrder> SalesOrders { get; set; } = null!;
        public DbSet<SalesOrderItem> SalesOrderItems { get; set; } = null!;

        // Distribution & Logistics
        public DbSet<Shipment> Shipments { get; set; } = null!;
        public DbSet<ShipmentItem> ShipmentItems { get; set; } = null!;

        // Warranty Management
        public DbSet<Warranty> Warranties { get; set; } = null!;
        public DbSet<WarrantyClaim> WarrantyClaims { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }
    }
}