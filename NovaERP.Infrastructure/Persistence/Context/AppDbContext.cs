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

        // Finance & Accounting
        public DbSet<ChartOfAccount> ChartOfAccounts { get; set; } = null!;
        public DbSet<CustomerInvoice> CustomerInvoices { get; set; } = null!;
        public DbSet<CustomerInvoiceItem> CustomerInvoiceItems { get; set; } = null!;
        public DbSet<SupplierInvoice> SupplierInvoices { get; set; } = null!;
        public DbSet<SupplierInvoiceItem> SupplierInvoiceItems { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<JournalEntry> JournalEntries { get; set; } = null!;
        public DbSet<JournalEntryLine> JournalEntryLines { get; set; } = null!;

        // HR & Workforce Management
        public DbSet<Department> Departments { get; set; } = null!;
        public DbSet<EmployeeProfile> EmployeeProfiles { get; set; } = null!;
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; } = null!;
        public DbSet<LeaveType> LeaveTypes { get; set; } = null!;
        public DbSet<LeaveRequest> LeaveRequests { get; set; } = null!;
        public DbSet<PayrollPeriod> PayrollPeriods { get; set; } = null!;
        public DbSet<PayrollEntry> PayrollEntries { get; set; } = null!;
        // Advanced Traceability
        public DbSet<InventoryBatch> InventoryBatches { get; set; } = null!;
        public DbSet<InventorySerialNumber> InventorySerialNumbers { get; set; } = null!;

        // Advanced Production & Manufacturing Operations (Domain 4)
        public DbSet<WorkCenter> WorkCenters { get; set; } = null!;
        public DbSet<Machine> Machines { get; set; } = null!;
        public DbSet<ProductionRouting> ProductionRoutings { get; set; } = null!;
        public DbSet<ProductionRoutingOperation> ProductionRoutingOperations { get; set; } = null!;
        public DbSet<ProductionWorkerAssignment> ProductionWorkerAssignments { get; set; } = null!;
        public DbSet<ProductionSchedule> ProductionSchedules { get; set; } = null!;
        public DbSet<ProductionEvent> ProductionEvents { get; set; } = null!;

        // Advanced Quality & Compliance (Domain 5)
        public DbSet<NonConformanceReport> NonConformanceReports { get; set; } = null!;
        public DbSet<CAPA> CAPAs { get; set; } = null!;
        public DbSet<QualityDisposition> QualityDispositions { get; set; } = null!;
        public DbSet<ReworkRequest> ReworkRequests { get; set; } = null!;
        public DbSet<ScrapRecord> ScrapRecords { get; set; } = null!;

        // Reverse Logistics / Returns (Domain 6)
        public DbSet<CustomerReturn> CustomerReturns { get; set; } = null!;
        public DbSet<CustomerReturnItem> CustomerReturnItems { get; set; } = null!;
        public DbSet<ReturnAuthorization> ReturnAuthorizations { get; set; } = null!;
        public DbSet<ReturnReceipt> ReturnReceipts { get; set; } = null!;
        public DbSet<ReturnDisposition> ReturnDispositions { get; set; } = null!;
        public DbSet<CustomerRepairRequest> CustomerRepairRequests { get; set; } = null!;
        public DbSet<ReplacementOrder> ReplacementOrders { get; set; } = null!;

        // Supplier Performance & Scorecards (Domain 7)
        public DbSet<SupplierScorecardConfig> SupplierScorecardConfigs { get; set; } = null!;

        // Logistics & Commercial Documents (Domain 8)
        public DbSet<PackingList> PackingLists { get; set; } = null!;
        public DbSet<PackingListItem> PackingListItems { get; set; } = null!;
        public DbSet<DeliveryChallan> DeliveryChallans { get; set; } = null!;
        public DbSet<DeliveryChallanItem> DeliveryChallanItems { get; set; } = null!;
        public DbSet<ShipmentDocument> ShipmentDocuments { get; set; } = null!;

        // In-App Notifications & Workflow Alerts (Domain 9)
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<UserNotificationPreference> UserNotificationPreferences { get; set; } = null!;



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            foreach (var entry in ChangeTracker.Entries<NovaERP.Domain.Common.AuditableEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        if (entry.Entity.CreatedAt == default || entry.Entity.CreatedAt == DateTime.MinValue)
                        {
                            entry.Entity.CreatedAt = DateTime.UtcNow;
                        }
                        break;
                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }
            return base.SaveChangesAsync(cancellationToken);
        }
    }
}