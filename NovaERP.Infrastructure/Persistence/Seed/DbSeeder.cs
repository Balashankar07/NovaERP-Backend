using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Persistence.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
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
        // Seed Roles
        // ==========================
        if (!await context.Roles.AnyAsync())
        {
            var roles = new List<Role>
            {
                new() { Name = "Super Admin" },
                new() { Name = "CEO" },
                new() { Name = "HR Manager" },
                new() { Name = "Finance Manager" },
                new() { Name = "Inventory Manager" },
                new() { Name = "Sales Manager" },
                new() { Name = "Employee" }
            };

            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();
        }

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

            new() { Name = "Permissions.QualityInspection.View", Description = "View Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Create", Description = "Create Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Update", Description = "Edit Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Delete", Description = "Delete Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Start", Description = "Start Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Complete", Description = "Complete Quality Inspection", Module = "QualityControl" },
            new() { Name = "Permissions.QualityInspection.Cancel", Description = "Cancel Quality Inspection", Module = "QualityControl" },
            
            new() { Name = "Permissions.SalesOrders.View", Description = "View Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Create", Description = "Create Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Update", Description = "Edit Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Delete", Description = "Delete Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Submit", Description = "Submit Sales Orders", Module = "SalesManagement" },
            new() { Name = "Permissions.SalesOrders.Approve", Description = "Approve Sales Orders", Module = "SalesManagement" },
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
            
            new() { Name = "Permissions.Reports.View", Description = "View Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Dashboard", Description = "View Dashboard Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Inventory", Description = "View Inventory Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Production", Description = "View Production Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Sales", Description = "View Sales Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Warranty", Description = "View Warranty Reports", Module = "Reports" },
            new() { Name = "Permissions.Reports.Audit", Description = "View Audit Reports", Module = "Reports" }
        };

        foreach (var p in permissions)
        {
            if (!await context.Permissions.AnyAsync(x => x.Name == p.Name))
            {
                await context.Permissions.AddAsync(p);
            }
        }
        await context.SaveChangesAsync();

        // ==========================
        // Seed Admin User
        // ==========================
        if (!await context.Users.AnyAsync())
        {
            var company = await context.Companies.FirstAsync();

            var superAdminRole = await context.Roles
                .FirstAsync(r => r.Name == "Super Admin");

            var admin = new User
            {
                FirstName = "System",
                LastName = "Administrator",
                Email = "balashankar07@gmail.com",
                Phone = "+91 9999999999",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                CompanyId = company.Id,
                IsActive = true,
                UserRoles = new List<UserRole>
                {
                    new UserRole { RoleId = superAdminRole.Id }
                }
            };

            await context.Users.AddAsync(admin);
            await context.SaveChangesAsync();
        }

        // ==========================
        // Seed Employee User (for negative RBAC testing)
        // ==========================
        if (!await context.Users.AnyAsync(u => u.Email == "balashankarspillai2027@mca.ajce.in"))
        {
            var company = await context.Companies.FirstAsync();
            var employeeRole = await context.Roles.FirstAsync(r => r.Name == "Employee");

            var emp = new User
            {
                FirstName = "Test",
                LastName = "Employee",
                Email = "balashankarspillai2027@mca.ajce.in",
                Phone = "+91 8888888888",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@123"),
                CompanyId = company.Id,
                IsActive = true,
                UserRoles = new List<UserRole>
                {
                    new UserRole { RoleId = employeeRole.Id }
                }
            };

            await context.Users.AddAsync(emp);
            await context.SaveChangesAsync();
        }

        // ==========================
        // Seed Super Admin Role Permissions
        // ==========================
        var superAdmin = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Super Admin");
        if (superAdmin != null)
        {
            var allPermissions = await context.Permissions.ToListAsync();
            var existingRolePermissions = await context.RolePermissions
                .Where(rp => rp.RoleId == superAdmin.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var newRolePermissions = allPermissions
                .Where(p => !existingRolePermissions.Contains(p.Id))
                .Select(p => new RolePermission
                {
                    RoleId = superAdmin.Id,
                    PermissionId = p.Id
                }).ToList();

            if (newRolePermissions.Any())
            {
                await context.RolePermissions.AddRangeAsync(newRolePermissions);
                await context.SaveChangesAsync();
            }
        }

        // ==========================
        // Seed Employee Role Permissions (Basic Read-Only Access)
        // ==========================
        var employeeRoleObj = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Employee");
        if (employeeRoleObj != null)
        {
            var employeeAllowedPermissions = new[]
            {
                "Permissions.Products.View",
                "Permissions.ProductCategories.View",
                "Permissions.Brands.View",
                "Permissions.Units.View",
                "Permissions.Suppliers.View"
            };

            var employeePermissions = await context.Permissions
                .Where(p => employeeAllowedPermissions.Contains(p.Name))
                .ToListAsync();

            var existingEmployeeRolePermissions = await context.RolePermissions
                .Where(rp => rp.RoleId == employeeRoleObj.Id)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var newEmployeeRolePermissions = employeePermissions
                .Where(p => !existingEmployeeRolePermissions.Contains(p.Id))
                .Select(p => new RolePermission
                {
                    RoleId = employeeRoleObj.Id,
                    PermissionId = p.Id
                }).ToList();

            if (newEmployeeRolePermissions.Any())
            {
                await context.RolePermissions.AddRangeAsync(newEmployeeRolePermissions);
                await context.SaveChangesAsync();
            }
        }

        // ==========================
        // Seed Product Categories
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

        // ==========================
        // Seed Brands
        // ==========================
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

        // ==========================
        // Seed Units
        // ==========================
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
    }
}