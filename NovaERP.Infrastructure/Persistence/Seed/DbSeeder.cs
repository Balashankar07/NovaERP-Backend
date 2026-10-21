using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Persistence.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, IConfiguration? configuration = null)
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE IF EXISTS ""Products"" ADD COLUMN IF NOT EXISTS ""Type"" integer NOT NULL DEFAULT 0;
                ALTER TABLE IF EXISTS ""Products"" ADD COLUMN IF NOT EXISTS ""ProductNumber"" character varying(50) NOT NULL DEFAULT '';
            ");
        }
        catch { }

        await context.Database.MigrateAsync();

        // ==========================
        // Seed Company
        // ==========================
        if (!await context.Companies.AnyAsync())
        {
            var company = new Company
            {
                Name = "Nova Electronics",
                Code = "NOVA",
                Email = "info@novaerp.com",
                Phone = "+91 9999999999",
                Website = "https://novaerp.com",
                Address = "Head Office",
                City = "Kottayam",
                State = "Kerala",
                Country = "India",
                PostalCode = "686001",
                IsActive = true
            };

            await context.Companies.AddAsync(company);
            await context.SaveChangesAsync();
        }

        // ==========================
        // Safe Role Cleanup & Migration
        // ==========================
        var allRoles = await context.Roles.ToListAsync();
        
        var systemAdminRole = allRoles.FirstOrDefault(r => r.Name == "System Administrator");
        var superAdminRole = allRoles.FirstOrDefault(r => r.Name == "Super Admin");

        // Merge System Administrator -> Super Admin
        if (systemAdminRole != null)
        {
            if (superAdminRole != null)
            {
                var systemAdminUserRoles = await context.UserRoles.Where(ur => ur.RoleId == systemAdminRole.Id).ToListAsync();
                foreach (var ur in systemAdminUserRoles)
                {
                    if (!await context.UserRoles.AnyAsync(x => x.UserId == ur.UserId && x.RoleId == superAdminRole.Id))
                    {
                        context.UserRoles.Add(new UserRole { UserId = ur.UserId, RoleId = superAdminRole.Id });
                    }
                    context.UserRoles.Remove(ur);
                }
                
                var systemAdminRolePerms = await context.RolePermissions.Where(rp => rp.RoleId == systemAdminRole.Id).ToListAsync();
                context.RolePermissions.RemoveRange(systemAdminRolePerms);

                context.Roles.Remove(systemAdminRole);
                await context.SaveChangesAsync();
                
                allRoles.Remove(systemAdminRole);
            }
            else
            {
                systemAdminRole.Name = "Super Admin";
                context.Roles.Update(systemAdminRole);
                await context.SaveChangesAsync();
                
                superAdminRole = systemAdminRole;
            }
        }

        // Legacy unassigned cleanup
        string[] legacyRoles = { "Finance Manager", "Distributor", "Employee", "HR Manager", "Inventory Manager", "CEO", "Production Supervisor" };
        foreach (var legacyName in legacyRoles)
        {
            var lrs = allRoles.Where(r => r.Name == legacyName).ToList();
            foreach (var lr in lrs)
            {
                bool hasUsers = await context.UserRoles.AnyAsync(ur => ur.RoleId == lr.Id);
                if (!hasUsers)
                {
                    var perms = await context.RolePermissions.Where(rp => rp.RoleId == lr.Id).ToListAsync();
                    context.RolePermissions.RemoveRange(perms);
                    context.Roles.Remove(lr);
                    allRoles.Remove(lr);
                }
            }
        }

        // Clean up inactive roles with 0 assigned users
        var inactiveUnassignedRoles = allRoles.Where(r => !r.IsActive).ToList();
        foreach (var lr in inactiveUnassignedRoles)
        {
            bool hasUsers = await context.UserRoles.AnyAsync(ur => ur.RoleId == lr.Id);
            if (!hasUsers)
            {
                var perms = await context.RolePermissions.Where(rp => rp.RoleId == lr.Id).ToListAsync();
                context.RolePermissions.RemoveRange(perms);
                context.Roles.Remove(lr);
                allRoles.Remove(lr);
            }
        }
        await context.SaveChangesAsync();

        // ==========================
        // Seed Canonical Roles
        // ==========================
        var canonicalRoles = new[]
        {
            "Super Admin",
            "Procurement Manager",
            "Production Manager",
            "Warehouse Manager",
            "Quality Engineer",
            "Sales Manager",
            "Warranty Executive"
        };

        foreach (var roleName in canonicalRoles)
        {
            if (!allRoles.Any(r => r.Name == roleName))
            {
                var newRole = new Role { Name = roleName };
                await context.Roles.AddAsync(newRole);
                allRoles.Add(newRole);
            }
        }
        await context.SaveChangesAsync();

        superAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Super Admin");

        // ==========================
        // Seed Permissions
        // ==========================
        var permissions = new List<Permission>
        {
            new() { Name = "Permissions.Users.View", Description = "View Users", Module = "Users" },
            new() { Name = "Permissions.Users.Create", Description = "Create Users", Module = "Users" },
            new() { Name = "Permissions.Users.Edit", Description = "Edit Users", Module = "Users" },
            new() { Name = "Permissions.Users.Delete", Description = "Delete Users", Module = "Users" },

            new() { Name = "Permissions.Roles.View", Description = "View Roles", Module = "Roles" },
            new() { Name = "Permissions.Roles.Create", Description = "Create Roles", Module = "Roles" },
            new() { Name = "Permissions.Roles.Edit", Description = "Edit Roles", Module = "Roles" },
            new() { Name = "Permissions.Roles.Delete", Description = "Delete Roles", Module = "Roles" },
            new() { Name = "Permissions.Roles.Assign", Description = "Assign Roles", Module = "Roles" },

            new() { Name = "Permissions.Dashboard.View", Description = "View Dashboard", Module = "Dashboard" },

            new() { Name = "Permissions.Products.View", Description = "View Products", Module = "Products" },
            new() { Name = "Permissions.Products.Create", Description = "Create Products", Module = "Products" },
            new() { Name = "Permissions.Products.Update", Description = "Edit Products", Module = "Products" },
            new() { Name = "Permissions.Products.Delete", Description = "Delete Products", Module = "Products" },

            new() { Name = "Permissions.ProductCategories.View", Description = "View Product Categories", Module = "Products" },
            new() { Name = "Permissions.ProductCategories.Create", Description = "Create Product Categories", Module = "Products" },
            new() { Name = "Permissions.ProductCategories.Update", Description = "Edit Product Categories", Module = "Products" },
            new() { Name = "Permissions.ProductCategories.Delete", Description = "Delete Product Categories", Module = "Products" },

            new() { Name = "Permissions.Brands.View", Description = "View Brands", Module = "Products" },
            new() { Name = "Permissions.Brands.Create", Description = "Create Brands", Module = "Products" },
            new() { Name = "Permissions.Brands.Update", Description = "Edit Brands", Module = "Products" },
            new() { Name = "Permissions.Brands.Delete", Description = "Delete Brands", Module = "Products" },

            new() { Name = "Permissions.Units.View", Description = "View Units", Module = "Products" },
            new() { Name = "Permissions.Units.Create", Description = "Create Units", Module = "Products" },
            new() { Name = "Permissions.Units.Update", Description = "Edit Units", Module = "Products" },
            new() { Name = "Permissions.Units.Delete", Description = "Delete Units", Module = "Products" },

            new() { Name = "Permissions.BOMs.View", Description = "View BOMs", Module = "BOMs" },
            new() { Name = "Permissions.BOMs.Create", Description = "Create BOMs", Module = "BOMs" },
            new() { Name = "Permissions.BOMs.Update", Description = "Edit BOMs", Module = "BOMs" },
            new() { Name = "Permissions.BOMs.Delete", Description = "Delete BOMs", Module = "BOMs" },

            new() { Name = "Permissions.Suppliers.View", Description = "View Suppliers", Module = "Suppliers" },
            new() { Name = "Permissions.Suppliers.Create", Description = "Create Suppliers", Module = "Suppliers" },
            new() { Name = "Permissions.Suppliers.Update", Description = "Edit Suppliers", Module = "Suppliers" },
            new() { Name = "Permissions.Suppliers.Delete", Description = "Delete Suppliers", Module = "Suppliers" },

            new() { Name = "Permissions.PurchaseOrders.View", Description = "View Purchase Orders", Module = "PurchaseOrders" },
            new() { Name = "Permissions.PurchaseOrders.Create", Description = "Create Purchase Orders", Module = "PurchaseOrders" },
            new() { Name = "Permissions.PurchaseOrders.Update", Description = "Edit Purchase Orders", Module = "PurchaseOrders" },
            new() { Name = "Permissions.PurchaseOrders.Delete", Description = "Delete Purchase Orders", Module = "PurchaseOrders" },
            new() { Name = "Permissions.PurchaseOrders.Submit", Description = "Submit Purchase Orders", Module = "PurchaseOrders" },
            new() { Name = "Permissions.PurchaseOrders.Approve", Description = "Approve Purchase Orders", Module = "PurchaseOrders" },
            new() { Name = "Permissions.PurchaseOrders.Reject", Description = "Reject Purchase Orders", Module = "PurchaseOrders" },

            new() { Name = "Permissions.PurchaseRequests.View", Description = "View Purchase Requests", Module = "PurchaseRequests" },
            new() { Name = "Permissions.PurchaseRequests.Create", Description = "Create Purchase Requests", Module = "PurchaseRequests" },
            new() { Name = "Permissions.PurchaseRequests.Update", Description = "Edit Purchase Requests", Module = "PurchaseRequests" },
            new() { Name = "Permissions.PurchaseRequests.Delete", Description = "Delete Purchase Requests", Module = "PurchaseRequests" },
            new() { Name = "Permissions.PurchaseRequests.Submit", Description = "Submit Purchase Requests", Module = "PurchaseRequests" },
            new() { Name = "Permissions.PurchaseRequests.Approve", Description = "Approve Purchase Requests", Module = "PurchaseRequests" },
            new() { Name = "Permissions.PurchaseRequests.Reject", Description = "Reject Purchase Requests", Module = "PurchaseRequests" },

            new() { Name = "Permissions.GoodsReceipts.View", Description = "View Goods Receipts", Module = "GoodsReceipts" },
            new() { Name = "Permissions.GoodsReceipts.Create", Description = "Create Goods Receipts", Module = "GoodsReceipts" },
            new() { Name = "Permissions.GoodsReceipts.Update", Description = "Edit Goods Receipts", Module = "GoodsReceipts" },
            new() { Name = "Permissions.GoodsReceipts.Delete", Description = "Delete Goods Receipts", Module = "GoodsReceipts" },
            new() { Name = "Permissions.GoodsReceipts.Receive", Description = "Receive Goods Receipts", Module = "GoodsReceipts" },
            new() { Name = "Permissions.GoodsReceipts.Complete", Description = "Complete Goods Receipts", Module = "GoodsReceipts" },
            new() { Name = "Permissions.GoodsReceipts.Cancel", Description = "Cancel Goods Receipts", Module = "GoodsReceipts" },

            new() { Name = "Permissions.Warehouses.View", Description = "View Warehouses", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouses.Create", Description = "Create Warehouses", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouses.Update", Description = "Edit Warehouses", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouses.Delete", Description = "Delete Warehouses", Module = "WarehouseManagement" },
            new() { Name = "Permissions.WarehouseLocations.View", Description = "View Warehouse Locations", Module = "WarehouseManagement" },
            new() { Name = "Permissions.WarehouseLocations.Create", Description = "Create Warehouse Locations", Module = "WarehouseManagement" },
            new() { Name = "Permissions.WarehouseLocations.Update", Description = "Edit Warehouse Locations", Module = "WarehouseManagement" },
            new() { Name = "Permissions.WarehouseLocations.Delete", Description = "Delete Warehouse Locations", Module = "WarehouseManagement" },

            new() { Name = "Permissions.Warehouse.Batches.View", Description = "View Batches & Lots", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.Batches.Create", Description = "Create Batches & Lots", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.Batches.Update", Description = "Update Batches & Lots", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.Serials.View", Description = "View Serial Numbers", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.Serials.Create", Description = "Register Serial Numbers", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.Serials.Update", Description = "Update Serial Numbers", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.Traceability.View", Description = "View Stock Traceability Timeline", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.DamagedStock.View", Description = "View Damaged Stock", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.DamagedStock.Manage", Description = "Manage Damaged Stock", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.BlockedStock.View", Description = "View Blocked Stock", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.BlockedStock.Manage", Description = "Manage Blocked Stock", Module = "WarehouseManagement" },
            new() { Name = "Permissions.Warehouse.Reports.View", Description = "View Traceability Reports", Module = "WarehouseManagement" },

            new() { Name = "Permissions.Inventory.View", Description = "View Inventory", Module = "Inventory" },
            new() { Name = "Permissions.Inventory.Adjust", Description = "Adjust Inventory", Module = "Inventory" },
            new() { Name = "Permissions.Inventory.Transfer", Description = "Transfer Inventory", Module = "Inventory" },
            new() { Name = "Permissions.Inventory.Transactions.View", Description = "View Inventory Transactions", Module = "Inventory" },

            new() { Name = "Permissions.ProductionPlans.View", Description = "View Production Plans", Module = "ProductionPlanning" },
            new() { Name = "Permissions.ProductionPlans.Create", Description = "Create Production Plans", Module = "ProductionPlanning" },
            new() { Name = "Permissions.ProductionPlans.Update", Description = "Edit Production Plans", Module = "ProductionPlanning" },
            new() { Name = "Permissions.ProductionPlans.Delete", Description = "Delete Production Plans", Module = "ProductionPlanning" },
            new() { Name = "Permissions.ProductionPlans.Release", Description = "Release Production Plans", Module = "ProductionPlanning" },

            new() { Name = "Permissions.ProductionOrders.View", Description = "View Production Orders", Module = "ProductionOrders" },
            new() { Name = "Permissions.ProductionOrders.Create", Description = "Create Production Orders", Module = "ProductionOrders" },
            new() { Name = "Permissions.ProductionOrders.Update", Description = "Edit Production Orders", Module = "ProductionOrders" },
            new() { Name = "Permissions.ProductionOrders.Delete", Description = "Delete Production Orders", Module = "ProductionOrders" },
            new() { Name = "Permissions.ProductionOrders.Release", Description = "Release Production Orders", Module = "ProductionOrders" },
            new() { Name = "Permissions.ProductionOrders.Start", Description = "Start Production Orders", Module = "ProductionOrders" },
            new() { Name = "Permissions.ProductionOrders.Complete", Description = "Complete Production Orders", Module = "ProductionOrders" },
            new() { Name = "Permissions.ProductionOrders.Cancel", Description = "Cancel Production Orders", Module = "ProductionOrders" },

            new() { Name = "Permissions.ProductionExecution.View", Description = "View Production Execution", Module = "ProductionExecution" },
            new() { Name = "Permissions.ProductionExecution.Create", Description = "Create Production Execution", Module = "ProductionExecution" },
            new() { Name = "Permissions.ProductionExecution.Update", Description = "Edit Production Execution", Module = "ProductionExecution" },
            new() { Name = "Permissions.ProductionExecution.Start", Description = "Start Production Execution", Module = "ProductionExecution" },
            new() { Name = "Permissions.ProductionExecution.Consume", Description = "Consume Materials", Module = "ProductionExecution" },
            new() { Name = "Permissions.ProductionExecution.Complete", Description = "Complete Production Execution", Module = "ProductionExecution" },
            new() { Name = "Permissions.ProductionExecution.Cancel", Description = "Cancel Production Execution", Module = "ProductionExecution" },

            new() { Name = "Permissions.Production.WorkCenters.View", Description = "View Work Centers", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.WorkCenters.Create", Description = "Create Work Centers", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.WorkCenters.Update", Description = "Update Work Centers", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Machines.View", Description = "View Equipment & Machines", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Machines.Create", Description = "Create Equipment & Machines", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Machines.Update", Description = "Update Equipment & Machines", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Routings.View", Description = "View Production Routings", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Routings.Create", Description = "Create Production Routings", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Routings.Update", Description = "Update Production Routings", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Assignments.View", Description = "View Worker Assignments", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Assignments.Create", Description = "Assign Workers", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Assignments.Update", Description = "Update Worker Assignments", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Schedules.View", Description = "View Production Schedules", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Schedules.Create", Description = "Create Schedules", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Schedules.Update", Description = "Update Schedules", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Schedules.Cancel", Description = "Cancel Schedules", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Events.View", Description = "View Downtime & Events", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Events.Create", Description = "Log Production Event", Module = "ProductionOperations" },
            new() { Name = "Permissions.Production.Reports.View", Description = "View Advanced Manufacturing Reports", Module = "ProductionOperations" },

            new() { Name = "Permissions.QualityInspection.View", Description = "View Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Create", Description = "Create Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Update", Description = "Edit Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Delete", Description = "Delete Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Start", Description = "Start Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Complete", Description = "Complete Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Cancel", Description = "Cancel Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.Quality.NCR.View", Description = "View Non-Conformance Reports", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.NCR.Create", Description = "Create Non-Conformance Report", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.NCR.Update", Description = "Update Non-Conformance Report", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.NCR.Assign", Description = "Assign Non-Conformance Report", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.NCR.Close", Description = "Close Non-Conformance Report", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.CAPA.View", Description = "View CAPA Actions", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.CAPA.Create", Description = "Create CAPA Action", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.CAPA.Update", Description = "Update CAPA Action", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.CAPA.Verify", Description = "Verify CAPA Action", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.CAPA.Close", Description = "Close CAPA Action", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Disposition.View", Description = "View Quality Dispositions", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Disposition.Create", Description = "Create Quality Disposition", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Disposition.Approve", Description = "Approve Quality Disposition", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Rework.View", Description = "View Rework Requests", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Rework.Create", Description = "Create Rework Request", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Rework.Approve", Description = "Approve Rework Request", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Rework.Complete", Description = "Complete Rework Request", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Scrap.View", Description = "View Scrap Records", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Scrap.Create", Description = "Create Scrap Record", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Scrap.Approve", Description = "Approve Scrap Record", Module = "QualityCompliance" },
            new() { Name = "Permissions.Quality.Reports.View", Description = "View Quality Compliance Reports", Module = "QualityCompliance" },

            new() { Name = "Permissions.Returns.View", Description = "View Customer Returns & RMAs", Module = "ReverseLogistics" },
            new() { Name = "Permissions.Returns.Create", Description = "Create Customer Returns", Module = "ReverseLogistics" },
            new() { Name = "Permissions.Returns.Approve", Description = "Approve Customer Returns & RMAs", Module = "ReverseLogistics" },
            new() { Name = "Permissions.Returns.Receive", Description = "Receive Returned Physical Goods", Module = "ReverseLogistics" },
            new() { Name = "Permissions.Returns.Inspect", Description = "Inspect Returned Goods", Module = "ReverseLogistics" },
            new() { Name = "Permissions.Returns.Disposition", Description = "Disposition Returned Goods", Module = "ReverseLogistics" },
            new() { Name = "Permissions.Returns.Repair", Description = "Manage Customer Repair Requests", Module = "ReverseLogistics" },
            new() { Name = "Permissions.Returns.Replace", Description = "Process Product Replacements", Module = "ReverseLogistics" },
            new() { Name = "Permissions.Returns.Close", Description = "Close Customer Returns & Claims", Module = "ReverseLogistics" },
            new() { Name = "Permissions.Returns.Reports.View", Description = "View Reverse Logistics Reports", Module = "ReverseLogistics" },

            new() { Name = "Permissions.SupplierPerformance.View", Description = "View Supplier Performance & Metrics", Module = "SupplierPerformance" },
            new() { Name = "Permissions.SupplierPerformance.Scorecards.View", Description = "View Supplier Scorecards & Formulations", Module = "SupplierPerformance" },
            new() { Name = "Permissions.SupplierPerformance.Reports.View", Description = "View Supplier Performance Analytics & Reports", Module = "SupplierPerformance" },
            new() { Name = "Permissions.SupplierPerformance.Configure", Description = "Configure Supplier Scorecard Weights & Rules", Module = "SupplierPerformance" },

            new() { Name = "Permissions.LogisticsDocuments.View", Description = "View Logistics & Commercial Documents", Module = "LogisticsDocuments" },
            new() { Name = "Permissions.LogisticsDocuments.PackingLists.Create", Description = "Create Draft Packing Lists", Module = "LogisticsDocuments" },
            new() { Name = "Permissions.LogisticsDocuments.PackingLists.Issue", Description = "Issue Packing Lists", Module = "LogisticsDocuments" },
            new() { Name = "Permissions.LogisticsDocuments.PackingLists.Cancel", Description = "Cancel Packing Lists", Module = "LogisticsDocuments" },
            new() { Name = "Permissions.LogisticsDocuments.DeliveryChallans.Create", Description = "Create Draft Delivery Challans", Module = "LogisticsDocuments" },
            new() { Name = "Permissions.LogisticsDocuments.DeliveryChallans.Issue", Description = "Issue Delivery Challans", Module = "LogisticsDocuments" },
            new() { Name = "Permissions.LogisticsDocuments.DeliveryChallans.Cancel", Description = "Cancel Delivery Challans", Module = "LogisticsDocuments" },
            new() { Name = "Permissions.LogisticsDocuments.Reports.View", Description = "View Logistics Document Analytics & Reports", Module = "LogisticsDocuments" },

            new() { Name = "Permissions.Notifications.View", Description = "View In-App Notifications", Module = "Notifications" },
            new() { Name = "Permissions.Notifications.MarkRead", Description = "Mark In-App Notifications as Read", Module = "Notifications" },
            new() { Name = "Permissions.Notifications.ManagePreferences", Description = "Manage Personal Notification Preferences", Module = "Notifications" },

            new() { Name = "Permissions.SalesOrders.View", Description = "View Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Create", Description = "Create Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Update", Description = "Edit Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Delete", Description = "Delete Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Submit", Description = "Submit Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Approve", Description = "Approve Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Reserve", Description = "Reserve Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Cancel", Description = "Cancel Sales Orders", Module = "SalesManagement" },

            new() { Name = "Permissions.Shipments.View", Description = "View Shipments", Module = "DistributionLogistics" },
            new() { Name = "Permissions.Shipments.Create", Description = "Create Shipments", Module = "DistributionLogistics" },
            new() { Name = "Permissions.Shipments.Update", Description = "Edit Shipments", Module = "DistributionLogistics" },
            new() { Name = "Permissions.Shipments.Delete", Description = "Delete Shipments", Module = "DistributionLogistics" },
            new() { Name = "Permissions.Shipments.Dispatch", Description = "Dispatch Shipments", Module = "DistributionLogistics" },
            new() { Name = "Permissions.Shipments.Deliver", Description = "Deliver Shipments", Module = "DistributionLogistics" },
            new() { Name = "Permissions.Shipments.Cancel", Description = "Cancel Shipments", Module = "DistributionLogistics" },

            new() { Name = "Permissions.Warranties.View", Description = "View Warranties", Module = "WarrantyServiceManagement" },
            new() { Name = "Permissions.Warranties.Create", Description = "Create Warranties", Module = "WarrantyServiceManagement" },
            new() { Name = "Permissions.Warranties.Update", Description = "Edit Warranties", Module = "WarrantyServiceManagement" },
            new() { Name = "Permissions.Warranties.Delete", Description = "Delete Warranties", Module = "WarrantyServiceManagement" },
            new() { Name = "Permissions.Warranties.Claim", Description = "Create Warranty Claim", Module = "WarrantyServiceManagement" },
            new() { Name = "Permissions.Warranties.Approve", Description = "Approve Warranty Claim", Module = "WarrantyServiceManagement" },
            new() { Name = "Permissions.Warranties.Reject", Description = "Reject Warranty Claim", Module = "WarrantyServiceManagement" },
            new() { Name = "Permissions.Warranties.Resolve", Description = "Resolve Warranty Claim", Module = "WarrantyServiceManagement" },
            new() { Name = "Permissions.Warranties.Close", Description = "Close Warranty or Claim", Module = "WarrantyServiceManagement" },

            new() { Name = "Companies.View", Description = "View Companies", Module = "SalesManagement" },
            new() { Name = "Companies.Create", Description = "Create Companies", Module = "SalesManagement" },
            new() { Name = "Companies.Update", Description = "Edit Companies", Module = "SalesManagement" },
            new() { Name = "Companies.Delete", Description = "Delete Companies", Module = "SalesManagement" },

            new() { Name = "Permissions.Reports.View", Description = "View Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Dashboard", Description = "View Dashboard Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Inventory", Description = "View Inventory Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Production", Description = "View Production Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Sales", Description = "View Sales Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Warranty", Description = "View Warranty Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Audit", Description = "View Audit Reports", Module = "Reports" },

            new() { Name = "Permissions.Finance.View", Description = "View Finance Module", Module = "Finance" },
            new() { Name = "Permissions.Finance.Invoices.View", Description = "View Invoices", Module = "Finance" },
            new() { Name = "Permissions.Finance.Invoices.Create", Description = "Create Invoices", Module = "Finance" },
            new() { Name = "Permissions.Finance.Invoices.Approve", Description = "Approve Invoices", Module = "Finance" },
            new() { Name = "Permissions.Finance.Invoices.Cancel", Description = "Cancel Invoices", Module = "Finance" },
            new() { Name = "Permissions.Finance.Payments.View", Description = "View Payments", Module = "Finance" },
            new() { Name = "Permissions.Finance.Payments.Create", Description = "Record Payments", Module = "Finance" },
            new() { Name = "Permissions.Finance.Payments.Approve", Description = "Approve Payments", Module = "Finance" },
            new() { Name = "Permissions.Finance.AccountsPayable.View", Description = "View Accounts Payable", Module = "Finance" },
            new() { Name = "Permissions.Finance.AccountsReceivable.View", Description = "View Accounts Receivable", Module = "Finance" },
            new() { Name = "Permissions.Finance.GeneralLedger.View", Description = "View General Ledger", Module = "Finance" },
            new() { Name = "Permissions.Finance.Journals.Create", Description = "Create Journal Entries", Module = "Finance" },
            new() { Name = "Permissions.Finance.Journals.Post", Description = "Post Journal Entries", Module = "Finance" },
            new() { Name = "Permissions.Finance.ChartOfAccounts.View", Description = "View Chart of Accounts", Module = "Finance" },
            new() { Name = "Permissions.Finance.ChartOfAccounts.Manage", Description = "Manage Chart of Accounts", Module = "Finance" },
            new() { Name = "Permissions.Finance.Reports.View", Description = "View Finance Reports", Module = "Finance" },

            new() { Name = "Permissions.HR.View", Description = "View HR Module", Module = "HR" },
            new() { Name = "Permissions.HR.Departments.View", Description = "View Departments", Module = "HR" },
            new() { Name = "Permissions.HR.Departments.Create", Description = "Create Departments", Module = "HR" },
            new() { Name = "Permissions.HR.Departments.Update", Description = "Edit Departments", Module = "HR" },
            new() { Name = "Permissions.HR.Employees.View", Description = "View Employees", Module = "HR" },
            new() { Name = "Permissions.HR.Employees.Create", Description = "Create Employees", Module = "HR" },
            new() { Name = "Permissions.HR.Employees.Update", Description = "Edit Employees", Module = "HR" },
            new() { Name = "Permissions.HR.Employees.Activate", Description = "Activate/Deactivate Employees", Module = "HR" },
            new() { Name = "Permissions.HR.Attendance.View", Description = "View Attendance Records", Module = "HR" },
            new() { Name = "Permissions.HR.Attendance.Create", Description = "Create Attendance Records", Module = "HR" },
            new() { Name = "Permissions.HR.Attendance.Update", Description = "Edit Attendance Records", Module = "HR" },
            new() { Name = "Permissions.HR.Leave.View", Description = "View Leave Requests", Module = "HR" },
            new() { Name = "Permissions.HR.Leave.Create", Description = "Create Leave Requests", Module = "HR" },
            new() { Name = "Permissions.HR.Leave.Approve", Description = "Approve Leave Requests", Module = "HR" },
            new() { Name = "Permissions.HR.Leave.Reject", Description = "Reject Leave Requests", Module = "HR" },
            new() { Name = "Permissions.HR.Payroll.View", Description = "View Payroll", Module = "HR" },
            new() { Name = "Permissions.HR.Payroll.Create", Description = "Create Payroll Periods/Entries", Module = "HR" },
            new() { Name = "Permissions.HR.Payroll.Process", Description = "Process Payroll", Module = "HR" },
            new() { Name = "Permissions.HR.Payroll.Approve", Description = "Approve & Pay Payroll", Module = "HR" },
            new() { Name = "Permissions.HR.Reports.View", Description = "View HR Reports", Module = "HR" }
        };

        var allPermsDict = await context.Permissions.ToDictionaryAsync(p => p.Name);
        foreach (var p in permissions)
        {
            if (!allPermsDict.ContainsKey(p.Name))
            {
                await context.Permissions.AddAsync(p);
                allPermsDict[p.Name] = p;
            }
        }
        await context.SaveChangesAsync();

        // ==========================
        // Grant All Permissions to Super Admin Role
        // ==========================
        if (superAdminRole != null)
        {
            var existingSuperAdminPermIds = (await context.RolePermissions
                .Where(rp => rp.RoleId == superAdminRole.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync())
                .ToHashSet();

            var missingPerms = allPermsDict.Values
                .Where(p => !existingSuperAdminPermIds.Contains(p.Id))
                .Select(p => new RolePermission
                {
                    RoleId = superAdminRole.Id,
                    PermissionId = p.Id
                })
                .ToList();

            if (missingPerms.Count > 0)
            {
                await context.RolePermissions.AddRangeAsync(missingPerms);
                await context.SaveChangesAsync();
            }
        }

        // ==========================
        // Seed Super Admin User
        // ==========================
        var superAdmin = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@novaerp.com");
        var defaultCompany = await context.Companies.FirstOrDefaultAsync();
        if (superAdmin == null && defaultCompany != null)
        {
            superAdmin = new User
            {
                Email = "admin@novaerp.com",
                FirstName = "Admin",
                LastName = "User",
                Phone = "+91 9999999999",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                IsActive = true,
                CompanyId = defaultCompany.Id
            };
            await context.Users.AddAsync(superAdmin);
            await context.SaveChangesAsync();
        }

        if (superAdmin != null && superAdminRole != null && !await context.UserRoles.AnyAsync(ur => ur.UserId == superAdmin.Id && ur.RoleId == superAdminRole.Id))
        {
            await context.UserRoles.AddAsync(new UserRole
            {
                UserId = superAdmin.Id,
                RoleId = superAdminRole.Id
            });
            await context.SaveChangesAsync();
        }

        // ==========================
        // Seed Product Categories, Brands, Units
        // ==========================
        if (!await context.ProductCategories.AnyAsync())
        {
            var categories = new List<ProductCategory>
            {
                new() { Name = "Electronics", Description = "Electronic Devices and Accessories" },
                new() { Name = "Computers", Description = "Laptops, Desktops and Peripherals" },
                new() { Name = "Home Appliances", Description = "Appliances for Home" }
            };

            await context.ProductCategories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }

        if (!await context.Brands.AnyAsync())
        {
            var brands = new List<Brand>
            {
                new() { Name = "Apple", Description = "Apple Inc." },
                new() { Name = "Samsung", Description = "Samsung Electronics" },
                new() { Name = "Sony", Description = "Sony Corporation" },
                new() { Name = "Dell", Description = "Dell Technologies" }
            };

            await context.Brands.AddRangeAsync(brands);
            await context.SaveChangesAsync();
        }

        if (!await context.Units.AnyAsync())
        {
            var units = new List<Unit>
            {
                new() { Name = "Piece", Abbreviation = "pcs" },
                new() { Name = "Box", Abbreviation = "box" },
                new() { Name = "Kilogram", Abbreviation = "kg" }
            };

            await context.Units.AddRangeAsync(units);
            await context.SaveChangesAsync();
        }

        if (!await context.Distributors.AnyAsync())
        {
            await context.Distributors.AddAsync(new Distributor
            {
                CompanyName = "Global Distribution Corp",
                ContactPerson = "John Sales",
                Phone = "+15550199",
                Email = "distributor@global.com",
                Address = "100 Logistics Blvd, Suite 200",
                IsActive = true
            });
            await context.SaveChangesAsync();
        }

        if (!await context.ChartOfAccounts.AnyAsync())
        {
            var accounts = new List<ChartOfAccount>
            {
                new() { AccountCode = "1010", AccountName = "Cash & Bank", Type = AccountType.Asset, Description = "Cash on hand and bank accounts", IsActive = true },
                new() { AccountCode = "1100", AccountName = "Accounts Receivable", Type = AccountType.Asset, Description = "Trade receivables from customers", IsActive = true },
                new() { AccountCode = "1200", AccountName = "Raw Materials Inventory", Type = AccountType.Asset, Description = "Stock value of raw components", IsActive = true },
                new() { AccountCode = "1210", AccountName = "Finished Goods Inventory", Type = AccountType.Asset, Description = "Stock value of finished products", IsActive = true },
                new() { AccountCode = "2000", AccountName = "Accounts Payable", Type = AccountType.Liability, Description = "Trade payables to suppliers", IsActive = true },
                new() { AccountCode = "2100", AccountName = "Tax Payable", Type = AccountType.Liability, Description = "Sales and commercial tax liability", IsActive = true },
                new() { AccountCode = "3000", AccountName = "Owner Equity / Retained Earnings", Type = AccountType.Equity, Description = "Capital and retained earnings", IsActive = true },
                new() { AccountCode = "4000", AccountName = "Sales Revenue", Type = AccountType.Revenue, Description = "Income from sales of products", IsActive = true },
                new() { AccountCode = "5000", AccountName = "Cost of Goods Sold (COGS)", Type = AccountType.Expense, Description = "Cost of products sold to customers", IsActive = true },
                new() { AccountCode = "6000", AccountName = "Operating Expenses", Type = AccountType.Expense, Description = "General operational and procurement expenses", IsActive = true }
            };

            await context.ChartOfAccounts.AddRangeAsync(accounts);
            await context.SaveChangesAsync();
        }

        if (!await context.Departments.AnyAsync())
        {
            var depts = new List<Department>
            {
                new() { DepartmentCode = "DEP-ADM", DepartmentName = "Administration", Description = "General System & Business Administration", IsActive = true },
                new() { DepartmentCode = "DEP-ENG", DepartmentName = "Engineering & Production", Description = "Manufacturing & Production Operations", IsActive = true },
                new() { DepartmentCode = "DEP-LOG", DepartmentName = "Logistics & Procurement", Description = "Supply Chain & Warehousing", IsActive = true },
                new() { DepartmentCode = "DEP-QA", DepartmentName = "Quality Assurance", Description = "Quality Control & Assurance", IsActive = true },
                new() { DepartmentCode = "DEP-SAL", DepartmentName = "Sales & Marketing", Description = "Commercial & Customer Relations", IsActive = true },
                new() { DepartmentCode = "DEP-FIN", DepartmentName = "Finance & Accounting", Description = "Financial Planning & Accounting", IsActive = true },
                new() { DepartmentCode = "DEP-HR", DepartmentName = "Human Resources", Description = "Workforce Management & Payroll", IsActive = true }
            };

            await context.Departments.AddRangeAsync(depts);
            await context.SaveChangesAsync();
        }

        if (!await context.LeaveTypes.AnyAsync())
        {
            var leaveTypes = new List<LeaveType>
            {
                new() { Name = "Annual Leave", Description = "Paid Annual Vacation", DefaultDaysPerYear = 14, IsActive = true },
                new() { Name = "Sick Leave", Description = "Paid Medical Leave", DefaultDaysPerYear = 10, IsActive = true },
                new() { Name = "Casual Leave", Description = "Short-term Casual Paid Absence", DefaultDaysPerYear = 7, IsActive = true },
                new() { Name = "Unpaid Leave", Description = "Unpaid Absence", DefaultDaysPerYear = 30, IsActive = true }
            };

            await context.LeaveTypes.AddRangeAsync(leaveTypes);
            await context.SaveChangesAsync();
        }

        // ==========================
        // Seed Warehouses & Suppliers
        // ==========================
        if (!await context.Warehouses.AnyAsync())
        {
            var mainPlant = new Warehouse
            {
                WarehouseCode = "WH-MAIN",
                WarehouseName = "Main Electronics Assembly Plant",
                Address = "Building 4A, High-Tech Industrial Zone",
                IsActive = true
            };
            var rawWh = new Warehouse
            {
                WarehouseCode = "WH-RAW",
                WarehouseName = "Raw Component Storage Vault",
                Address = "Building 4B, High-Tech Industrial Zone",
                IsActive = true
            };
            var fgWh = new Warehouse
            {
                WarehouseCode = "WH-FG",
                WarehouseName = "Finished Goods Dispatch Depot",
                Address = "Logistics Dock 12",
                IsActive = true
            };

            await context.Warehouses.AddRangeAsync(mainPlant, rawWh, fgWh);
            await context.SaveChangesAsync();
        }

        if (!await context.Suppliers.AnyAsync())
        {
            var suppliers = new List<Supplier>
            {
                new() { SupplierName = "Espressif Systems Semiconductor", SupplierCode = "SUP-ESP-01", ContactPerson = "Li Wei", Email = "sales@espressif.com", Phone = "+862161062000", AddressLine1 = "High Tech Park", City = "Shanghai", Country = "China", IsActive = true },
                new() { SupplierName = "Texas Instruments Inc", SupplierCode = "SUP-TI-02", ContactPerson = "Sarah Jenkins", Email = "orders@ti.com", Phone = "+18003357200", AddressLine1 = "TI Boulevard", City = "Dallas", Country = "USA", IsActive = true },
                new() { SupplierName = "STMicroelectronics NV", SupplierCode = "SUP-STM-03", ContactPerson = "Jean-Luc Picard", Email = "contact@st.com", Phone = "+33476926000", AddressLine1 = "Route de Jean", City = "Geneva", Country = "Switzerland", IsActive = true },
                new() { SupplierName = "Quectel Wireless Solutions", SupplierCode = "SUP-QUEC-04", ContactPerson = "Alex Chen", Email = "support@quectel.com", Phone = "+862151086236", AddressLine1 = "Building 5", City = "Shanghai", Country = "China", IsActive = true },
                new() { SupplierName = "Yihua Metal & Aluminum Chassis", SupplierCode = "SUP-YIH-05", ContactPerson = "Mark Zhang", Email = "orders@yihuametal.com", Phone = "+867552819000", AddressLine1 = "Baoan Industrial Zone", City = "Shenzhen", Country = "China", IsActive = true }
            };

            await context.Suppliers.AddRangeAsync(suppliers);
            await context.SaveChangesAsync();
        }

        // ==========================
        // Seed 5 Main Finished Goods & Real Raw Material Components
        // ==========================
        if (!await context.Products.AnyAsync())
        {
            var electronicsCat = await context.ProductCategories.FirstOrDefaultAsync(c => c.Name == "Electronics") ?? await context.ProductCategories.FirstAsync();
            var computersCat = await context.ProductCategories.FirstOrDefaultAsync(c => c.Name == "Computers") ?? electronicsCat;
            var appliancesCat = await context.ProductCategories.FirstOrDefaultAsync(c => c.Name == "Home Appliances") ?? electronicsCat;

            var novaBrand = await context.Brands.FirstOrDefaultAsync(b => b.Name == "Sony") ?? await context.Brands.FirstAsync();
            var unitPcs = await context.Units.FirstOrDefaultAsync(u => u.Abbreviation == "pcs") ?? await context.Units.FirstAsync();

            // 1. Raw Component Products
            var compEsp32 = new Product { ProductNumber = "PRD-RAW-001", ProductCode = "CMP-MCU-001", SKU = "SKU-MCU-001", Name = "ESP32-WROOM-32U Microcontroller Module", Description = "Dual-core 240MHz Wi-Fi/BLE MCU", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 3.50m, SellingPrice = 5.00m, MinimumStock = 10, MaximumStock = 1000, ReorderLevel = 100, IsActive = true };
            var compLte = new Product { ProductNumber = "PRD-RAW-002", ProductCode = "CMP-MOD-002", SKU = "SKU-MOD-002", Name = "Quectel EC25-E 4G LTE Cellular Modem", Description = "Multi-band LTE Cat 4 IoT Module", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 18.00m, SellingPrice = 25.00m, MinimumStock = 5, MaximumStock = 500, ReorderLevel = 50, IsActive = true };
            var compPcbIot = new Product { ProductNumber = "PRD-RAW-003", ProductCode = "CMP-PCB-003", SKU = "SKU-PCB-003", Name = "FR-4 4-Layer Printed Circuit Board (IoT)", Description = "ENIG Surface Finish 100x80mm PCB", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 4.20m, SellingPrice = 7.00m, MinimumStock = 25, MaximumStock = 1000, ReorderLevel = 100, IsActive = true };
            var compEncIot = new Product { ProductNumber = "PRD-RAW-004", ProductCode = "CMP-ENC-004", SKU = "SKU-ENC-004", Name = "Aluminum IP67 Industrial Outer Enclosure", Description = "Weatherproof Die-Cast Aluminum Casing", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 12.50m, SellingPrice = 18.00m, MinimumStock = 10, MaximumStock = 200, ReorderLevel = 30, IsActive = true };

            var compStm32 = new Product { ProductNumber = "PRD-RAW-005", ProductCode = "CMP-MCU-005", SKU = "SKU-MCU-005", Name = "STM32F407VGT6 ARM Cortex-M4 MCU", Description = "32-Bit 168MHz 1MB Flash Microcontroller", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 8.75m, SellingPrice = 12.00m, MinimumStock = 10, MaximumStock = 500, ReorderLevel = 80, IsActive = true };
            var compEnergyIC = new Product { ProductNumber = "PRD-RAW-006", ProductCode = "CMP-SEN-006", SKU = "SKU-SEN-006", Name = "ADE7953 Dual-Phase Energy Measurement IC", Description = "Polyphase Multifunction Energy Metering IC", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 5.60m, SellingPrice = 8.50m, MinimumStock = 10, MaximumStock = 400, ReorderLevel = 50, IsActive = true };
            var compCTSensor = new Product { ProductNumber = "PRD-RAW-007", ProductCode = "CMP-CT-007", SKU = "SKU-CT-007", Name = "Current Transformer Sensor 100A/5A", Description = "Precision High-Current Transformer Transducer", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 6.80m, SellingPrice = 10.00m, MinimumStock = 15, MaximumStock = 500, ReorderLevel = 60, IsActive = true };
            var compLcdDisplay = new Product { ProductNumber = "PRD-RAW-008", ProductCode = "CMP-DSP-008", SKU = "SKU-DSP-008", Name = "16x2 Backlit Graphical LCD Display Panel", Description = "ST7066 Controller Blue Backlit Screen", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 4.50m, SellingPrice = 7.00m, MinimumStock = 10, MaximumStock = 300, ReorderLevel = 40, IsActive = true };

            var compMosfet = new Product { ProductNumber = "PRD-RAW-009", ProductCode = "CMP-TR-009", SKU = "SKU-TR-009", Name = "IRFB4110 MOSFET Transistor High Current", Description = "100V 180A N-Channel MOSFET Power Transistor", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 2.15m, SellingPrice = 3.50m, MinimumStock = 50, MaximumStock = 2000, ReorderLevel = 200, IsActive = true };
            var compToroid = new Product { ProductNumber = "PRD-RAW-010", ProductCode = "CMP-XFR-010", SKU = "SKU-XFR-010", Name = "Toroidal Pure Copper Transformer 2000VA", Description = "230V to 24V Heavy Duty Power Transformer", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 65.00m, SellingPrice = 95.00m, MinimumStock = 2, MaximumStock = 50, ReorderLevel = 10, IsActive = true };

            var compFingerprint = new Product { ProductNumber = "PRD-RAW-011", ProductCode = "CMP-BIO-011", SKU = "SKU-BIO-011", Name = "Optical Fingerprint Biometric Sensor Module", Description = "500DPI High-Resolution Optical Scanner", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 14.50m, SellingPrice = 22.00m, MinimumStock = 5, MaximumStock = 200, ReorderLevel = 25, IsActive = true };
            var compTouchDisplay = new Product { ProductNumber = "PRD-RAW-012", ProductCode = "CMP-TFT-012", SKU = "SKU-TFT-012", Name = "3.5 Inch TFT Capacitive Touch Screen", Description = "480x320 RGB IPS Color LCD Display", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 16.20m, SellingPrice = 24.00m, MinimumStock = 5, MaximumStock = 200, ReorderLevel = 25, IsActive = true };

            var compTmcDriver = new Product { ProductNumber = "PRD-RAW-013", ProductCode = "CMP-DRV-013", SKU = "SKU-DRV-013", Name = "TMC5160 High-Power Stepper Motor Driver IC", Description = "60V 20A SilentStepStick Motor Controller", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.Component, CostPrice = 9.40m, SellingPrice = 15.00m, MinimumStock = 20, MaximumStock = 500, ReorderLevel = 100, IsActive = true };

            var components = new List<Product>
            {
                compEsp32, compLte, compPcbIot, compEncIot, compStm32, compEnergyIC, compCTSensor, compLcdDisplay, compMosfet, compToroid, compFingerprint, compTouchDisplay, compTmcDriver
            };

            await context.Products.AddRangeAsync(components);
            await context.SaveChangesAsync();

            // 2. 5 Main Finished Goods
            var fgIot = new Product { ProductNumber = "PRD-FG-001", ProductCode = "FG-IOT-001", SKU = "SKU-FG-IOT-001", Name = "Nova Pro IoT Gateway Controller", Description = "Industrial IoT Telemetry Controller with 4G & RS485 Modbus", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.FinishedGood, CostPrice = 110.00m, SellingPrice = 185.00m, MinimumStock = 5, MaximumStock = 100, ReorderLevel = 10, IsActive = true };
            var fgSmartMeter = new Product { ProductNumber = "PRD-FG-002", ProductCode = "FG-SMART-002", SKU = "SKU-FG-SMART-002", Name = "Nova Smart Metering Energy Monitor", Description = "3-Phase Digital Smart Meter with LCD & MODBUS Remote Telemetry", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.FinishedGood, CostPrice = 145.00m, SellingPrice = 240.00m, MinimumStock = 5, MaximumStock = 100, ReorderLevel = 15, IsActive = true };
            var fgUps = new Product { ProductNumber = "PRD-FG-003", ProductCode = "FG-UPS-003", SKU = "SKU-FG-UPS-003", Name = "Nova PureSine Industrial UPS 2KW", Description = "2000W Pure Sine Wave Uninterruptible Power Supply & Battery Backup", CategoryId = appliancesCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.FinishedGood, CostPrice = 310.00m, SellingPrice = 495.00m, MinimumStock = 2, MaximumStock = 50, ReorderLevel = 5, IsActive = true };
            var fgAccessTerminal = new Product { ProductNumber = "PRD-FG-004", ProductCode = "FG-SEC-004", SKU = "SKU-FG-SEC-004", Name = "Nova SecureAccess Biometric Terminal", Description = "Optical Fingerprint & RFID Time Attendance Access Controller", CategoryId = computersCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.FinishedGood, CostPrice = 160.00m, SellingPrice = 275.00m, MinimumStock = 3, MaximumStock = 80, ReorderLevel = 8, IsActive = true };
            var fgCncController = new Product { ProductNumber = "PRD-FG-005", ProductCode = "FG-CNC-005", SKU = "SKU-FG-CNC-005", Name = "Nova ServoMotion 4-Axis CNC Controller", Description = "High-Precision 4-Axis Stepper & Servo Motion Controller Board", CategoryId = electronicsCat.Id, BrandId = novaBrand.Id, UnitId = unitPcs.Id, Type = ProductType.FinishedGood, CostPrice = 220.00m, SellingPrice = 380.00m, MinimumStock = 2, MaximumStock = 50, ReorderLevel = 5, IsActive = true };

            var finishedGoods = new List<Product> { fgIot, fgSmartMeter, fgUps, fgAccessTerminal, fgCncController };
            await context.Products.AddRangeAsync(finishedGoods);
            await context.SaveChangesAsync();

            // 3. Seed Initial Inventory Stock for Raw Components & Finished Goods
            var rawWh = await context.Warehouses.FirstOrDefaultAsync(w => w.WarehouseCode == "WH-RAW") ?? await context.Warehouses.FirstAsync();
            var fgWh = await context.Warehouses.FirstOrDefaultAsync(w => w.WarehouseCode == "WH-FG") ?? rawWh;

            var inventories = new List<Inventory>();
            foreach (var comp in components)
            {
                inventories.Add(new Inventory { WarehouseId = rawWh.Id, ProductId = comp.Id, QuantityOnHand = 250, QuantityReserved = 0, QuantityAvailable = 250, ReorderLevel = 100, MinimumLevel = 10, MaximumLevel = 1000, LastStockUpdate = DateTime.UtcNow });
            }
            foreach (var fg in finishedGoods)
            {
                inventories.Add(new Inventory { WarehouseId = fgWh.Id, ProductId = fg.Id, QuantityOnHand = 25, QuantityReserved = 0, QuantityAvailable = 25, ReorderLevel = 10, MinimumLevel = 5, MaximumLevel = 100, LastStockUpdate = DateTime.UtcNow });
            }
            await context.Inventories.AddRangeAsync(inventories);
            await context.SaveChangesAsync();

            // ==========================
            // Seed Supplier Products (Links Suppliers to Raw Components)
            // ==========================
            if (!await context.SupplierProducts.AnyAsync())
            {
                var espSupplier = await context.Suppliers.FirstOrDefaultAsync(s => s.SupplierCode == "SUP-ESP-01") ?? await context.Suppliers.FirstAsync();
                var tiSupplier = await context.Suppliers.FirstOrDefaultAsync(s => s.SupplierCode == "SUP-TI-02") ?? await context.Suppliers.FirstAsync();
                
                var sp1 = new SupplierProduct { SupplierId = espSupplier.Id, ProductId = compEsp32.Id, SupplierSKU = "ESP-OEM-32U", UnitPrice = 3.20m, LeadTimeDays = 7, MOQ = 50, IsPreferred = true };
                var sp2 = new SupplierProduct { SupplierId = espSupplier.Id, ProductId = compLte.Id, SupplierSKU = "ESP-QCT-EC25", UnitPrice = 17.50m, LeadTimeDays = 10, MOQ = 20, IsPreferred = true };
                var sp3 = new SupplierProduct { SupplierId = tiSupplier.Id, ProductId = compStm32.Id, SupplierSKU = "TI-STM-407", UnitPrice = 8.50m, LeadTimeDays = 5, MOQ = 100, IsPreferred = true };
                var sp4 = new SupplierProduct { SupplierId = tiSupplier.Id, ProductId = compEnergyIC.Id, SupplierSKU = "TI-ADE7953", UnitPrice = 5.40m, LeadTimeDays = 14, MOQ = 250, IsPreferred = true };
                var sp5 = new SupplierProduct { SupplierId = tiSupplier.Id, ProductId = compMosfet.Id, SupplierSKU = "TI-IRFB4110", UnitPrice = 2.00m, LeadTimeDays = 3, MOQ = 500, IsPreferred = true };

                await context.SupplierProducts.AddRangeAsync(sp1, sp2, sp3, sp4, sp5);
                await context.SaveChangesAsync();
            }

            // 4. Seed Real-World Bill of Materials (BOM) for each 5 Finished Products
            var bom1 = new BOM
            {
                ProductId = fgIot.Id,
                Version = "v1.0",
                Description = "Standard Assembly BOM - Nova Pro IoT Gateway",
                IsActive = true,
                EffectiveDate = DateTime.UtcNow.AddMonths(-6),
                BOMItems = new List<BOMItem>
                {
                    new() { RawMaterialProductId = compEsp32.Id, Quantity = 1, WastePercentage = 2.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compLte.Id, Quantity = 1, WastePercentage = 1.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compPcbIot.Id, Quantity = 1, WastePercentage = 3.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compEncIot.Id, Quantity = 1, WastePercentage = 1.0m, UnitId = unitPcs.Id }
                }
            };

            var bom2 = new BOM
            {
                ProductId = fgSmartMeter.Id,
                Version = "v1.0",
                Description = "Standard Assembly BOM - Smart Energy Monitor",
                IsActive = true,
                EffectiveDate = DateTime.UtcNow.AddMonths(-6),
                BOMItems = new List<BOMItem>
                {
                    new() { RawMaterialProductId = compStm32.Id, Quantity = 1, WastePercentage = 2.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compEnergyIC.Id, Quantity = 1, WastePercentage = 1.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compCTSensor.Id, Quantity = 3, WastePercentage = 2.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compLcdDisplay.Id, Quantity = 1, WastePercentage = 3.0m, UnitId = unitPcs.Id }
                }
            };

            var bom3 = new BOM
            {
                ProductId = fgUps.Id,
                Version = "v1.0",
                Description = "Standard Assembly BOM - PureSine Industrial UPS 2KW",
                IsActive = true,
                EffectiveDate = DateTime.UtcNow.AddMonths(-6),
                BOMItems = new List<BOMItem>
                {
                    new() { RawMaterialProductId = compMosfet.Id, Quantity = 8, WastePercentage = 3.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compToroid.Id, Quantity = 1, WastePercentage = 0.5m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compEncIot.Id, Quantity = 1, WastePercentage = 1.0m, UnitId = unitPcs.Id }
                }
            };

            var bom4 = new BOM
            {
                ProductId = fgAccessTerminal.Id,
                Version = "v1.0",
                Description = "Standard Assembly BOM - Biometric Access Terminal",
                IsActive = true,
                EffectiveDate = DateTime.UtcNow.AddMonths(-6),
                BOMItems = new List<BOMItem>
                {
                    new() { RawMaterialProductId = compFingerprint.Id, Quantity = 1, WastePercentage = 2.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compTouchDisplay.Id, Quantity = 1, WastePercentage = 3.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compStm32.Id, Quantity = 1, WastePercentage = 1.0m, UnitId = unitPcs.Id }
                }
            };

            var bom5 = new BOM
            {
                ProductId = fgCncController.Id,
                Version = "v1.0",
                Description = "Standard Assembly BOM - 4-Axis CNC Controller",
                IsActive = true,
                EffectiveDate = DateTime.UtcNow.AddMonths(-6),
                BOMItems = new List<BOMItem>
                {
                    new() { RawMaterialProductId = compTmcDriver.Id, Quantity = 4, WastePercentage = 2.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compStm32.Id, Quantity = 1, WastePercentage = 1.0m, UnitId = unitPcs.Id },
                    new() { RawMaterialProductId = compPcbIot.Id, Quantity = 1, WastePercentage = 2.0m, UnitId = unitPcs.Id }
                }
            };

            await context.BOMs.AddRangeAsync(bom1, bom2, bom3, bom4, bom5);
            await context.SaveChangesAsync();
        }
    }
}