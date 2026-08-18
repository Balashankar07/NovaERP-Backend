using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Features.Reports.DTOs;
using NovaERP.Application.Features.Reports.Interfaces;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories.Reports;

public class ReportRepository : IReportRepository
{
    private readonly AppDbContext _context;

    public ReportRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var totalProducts = await _context.Products.CountAsync(cancellationToken);
        var totalSuppliers = await _context.Suppliers.CountAsync(cancellationToken);
        var totalWarehouses = await _context.Warehouses.CountAsync(cancellationToken);

        var totalInventoryValue = await _context.Inventories
            .Join(_context.Products, i => i.ProductId, p => p.Id, (i, p) => i.QuantityOnHand * p.CostPrice)
            .SumAsync(cancellationToken);

        var openPurchaseOrders = await _context.PurchaseOrders
            .CountAsync(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Draft || po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PendingApproval || po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved, cancellationToken);

        var completedProductionOrders = await _context.ProductionOrders
            .CountAsync(po => po.Status == NovaERP.Domain.Enums.ProductionOrderStatus.Completed, cancellationToken);

        var pendingQualityInspections = await _context.QualityInspections
            .CountAsync(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.Draft || qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.InProgress, cancellationToken);

        var currentMonth = DateTime.UtcNow.Month;
        var currentYear = DateTime.UtcNow.Year;
        
        var salesThisMonth = await _context.SalesOrders
            .Where(so => so.OrderDate.Month == currentMonth && so.OrderDate.Year == currentYear)
            .SumAsync(so => so.TotalAmount, cancellationToken);

        var shipmentsPending = await _context.Shipments
            .CountAsync(s => s.Status == NovaERP.Domain.Enums.ShipmentStatus.Pending, cancellationToken);

        var activeWarranties = await _context.Warranties
            .CountAsync(w => w.Status == NovaERP.Domain.Enums.WarrantyStatus.Active, cancellationToken);

        var openWarrantyClaims = await _context.WarrantyClaims
            .CountAsync(wc => wc.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Pending || wc.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.UnderReview, cancellationToken);

        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        var recentProduction = await _context.ProductionOrders
            .Where(po => po.Status == NovaERP.Domain.Enums.ProductionOrderStatus.Completed && po.UpdatedAt >= sixMonthsAgo)
            .Select(po => new { po.UpdatedAt, po.PlannedQuantity })
            .ToListAsync(cancellationToken);

        var monthlyData = recentProduction
            .GroupBy(po => new { po.UpdatedAt!.Value.Year, po.UpdatedAt!.Value.Month })
            .Select(g => new ProductionChartDto
            {
                Name = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                Units = (int)g.Sum(po => po.PlannedQuantity)
            })
            .OrderBy(x => DateTime.ParseExact(x.Name, "MMM", System.Globalization.CultureInfo.InvariantCulture).Month)
            .ToList();

        // Ensure we have months even if no data
        var allMonths = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-5 + i))
            .Select(d => d.ToString("MMM"))
            .ToList();

        var finalMonthlyData = allMonths.Select(m => new ProductionChartDto
        {
            Name = m,
            Units = monthlyData.FirstOrDefault(md => md.Name == m)?.Units ?? 0
        }).ToList();

        return new DashboardSummaryDto
        {
            TotalProducts = totalProducts,
            TotalSuppliers = totalSuppliers,
            TotalWarehouses = totalWarehouses,
            TotalInventoryValue = totalInventoryValue,
            OpenPurchaseOrders = openPurchaseOrders,
            CompletedProductionOrders = completedProductionOrders,
            PendingQualityInspections = pendingQualityInspections,
            SalesThisMonth = salesThisMonth,
            ShipmentsPending = shipmentsPending,
            ActiveWarranties = activeWarranties,
            OpenWarrantyClaims = openWarrantyClaims,
            MonthlyProduction = finalMonthlyData
        };
    }

    public async Task<InventorySummaryDto> GetInventorySummaryAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var totalProducts = await _context.Inventories.Select(i => i.ProductId).Distinct().CountAsync(cancellationToken);
        
        var totalOnHand = await _context.Inventories.SumAsync(i => i.QuantityOnHand, cancellationToken);
        var totalReserved = await _context.Inventories.SumAsync(i => i.QuantityReserved, cancellationToken);
        var totalAvailable = await _context.Inventories.SumAsync(i => i.QuantityAvailable, cancellationToken);
        
        var lowStock = await _context.Inventories.CountAsync(i => i.QuantityAvailable <= i.Product!.ReorderLevel && i.QuantityAvailable > 0, cancellationToken);
        var outOfStock = await _context.Inventories.CountAsync(i => i.QuantityAvailable <= 0, cancellationToken);
        
        var warehouses = await _context.Warehouses.CountAsync(w => w.IsActive, cancellationToken);
        
        var recentMovements = await _context.InventoryTransactions
            .Where(t => t.CreatedAt >= now.AddDays(-7))
            .CountAsync(cancellationToken);

        return new InventorySummaryDto
        {
            TotalProductsInStock = totalProducts,
            TotalOnHandQuantity = totalOnHand,
            TotalReservedQuantity = totalReserved,
            TotalAvailableQuantity = totalAvailable,
            LowStockItems = lowStock,
            OutOfStockItems = outOfStock,
            WarehouseCount = warehouses,
            RecentMovementCount = recentMovements
        };
    }

    public async Task<ProcurementSummaryDto> GetProcurementSummaryAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var pendingPurchaseRequests = await _context.PurchaseRequests
            .CountAsync(pr => pr.Status == NovaERP.Domain.Enums.PurchaseRequestStatus.Draft || 
                              pr.Status == NovaERP.Domain.Enums.PurchaseRequestStatus.Submitted ||
                              pr.Status == NovaERP.Domain.Enums.PurchaseRequestStatus.PartiallyConverted, cancellationToken);

        var awaitingApproval = await _context.PurchaseRequests
            .CountAsync(pr => pr.Status == NovaERP.Domain.Enums.PurchaseRequestStatus.PendingApproval, cancellationToken);

        var openPurchaseOrders = await _context.PurchaseOrders
            .CountAsync(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Draft || 
                              po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PendingApproval || 
                              po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved, cancellationToken);

        var pendingReceipts = await _context.PurchaseOrders
            .Where(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved)
            .CountAsync(po => po.Items.Sum(i => i.Quantity) > 
                (_context.GoodsReceiptItems.Where(gri => gri.GoodsReceipt!.PurchaseOrderId == po.Id).Sum(gri => (decimal?)gri.ReceivedQuantity) ?? 0m), cancellationToken);

        var overdueReceipts = await _context.PurchaseOrders
            .Where(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved && po.ExpectedDeliveryDate.Date < now.Date)
            .CountAsync(po => po.Items.Sum(i => i.Quantity) > 
                (_context.GoodsReceiptItems.Where(gri => gri.GoodsReceipt!.PurchaseOrderId == po.Id).Sum(gri => (decimal?)gri.ReceivedQuantity) ?? 0m), cancellationToken);

        var totalProcurementValue = await _context.PurchaseOrders
            .Where(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Draft || 
                         po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PendingApproval || 
                         po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved)
            .SumAsync(po => po.TotalAmount, cancellationToken);

        var needsAttention = new List<ProcurementAttentionItemDto>();

        var overduePOs = await _context.PurchaseOrders
            .Where(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved && po.ExpectedDeliveryDate.Date < now.Date)
            .Where(po => po.Items.Sum(i => i.Quantity) > 
                (_context.GoodsReceiptItems.Where(gri => gri.GoodsReceipt!.PurchaseOrderId == po.Id).Sum(gri => (decimal?)gri.ReceivedQuantity) ?? 0m))
            .OrderBy(po => po.ExpectedDeliveryDate)
            .Take(5)
            .Select(po => new ProcurementAttentionItemDto
            {
                Reference = po.PONumber,
                Type = "Purchase Order",
                Priority = "Urgent",
                Description = po.Supplier != null ? po.Supplier.SupplierName : "Supplier",
                Status = "Overdue",
                DueDate = po.ExpectedDeliveryDate,
                ReferenceId = po.Id,
                ActionType = "View"
            })
            .ToListAsync(cancellationToken);

        var approvalPRs = await _context.PurchaseRequests
            .Where(pr => pr.Status == NovaERP.Domain.Enums.PurchaseRequestStatus.PendingApproval)
            .OrderBy(pr => pr.CreatedAt)
            .Take(5)
            .Select(pr => new ProcurementAttentionItemDto
            {
                Reference = pr.RequestNumber,
                Type = "Purchase Request",
                Priority = "High",
                Description = "Awaiting Approval",
                Status = "Pending",
                DueDate = pr.RequiredByDate,
                ReferenceId = pr.Id,
                ActionType = "Approve"
            })
            .ToListAsync(cancellationToken);

        var inventoryAlerts = await _context.Inventories
            .Where(i => i.QuantityOnHand < i.Product!.ReorderLevel)
            .OrderBy(i => i.QuantityOnHand)
            .Take(5)
            .Select(i => new ProcurementAttentionItemDto
            {
                Reference = i.Product!.ProductCode,
                Type = "Inventory Alert",
                Priority = "Medium",
                Description = "Below Reorder Level",
                Status = "Low Stock",
                DueDate = null,
                ReferenceId = i.Id,
                ActionType = "View"
            })
            .ToListAsync(cancellationToken);

        var productionShortages = await _context.ProductionRequirements
            .Where(pr => pr.ShortageQuantity > 0 && pr.ProductionPlan.Status != NovaERP.Domain.Enums.ProductionPlanStatus.Cancelled && pr.ProductionPlan.Status != NovaERP.Domain.Enums.ProductionPlanStatus.Completed)
            .OrderByDescending(pr => pr.ShortageQuantity)
            .Take(5)
            .Select(pr => new ProcurementAttentionItemDto
            {
                Reference = pr.Product.ProductCode,
                Type = "Production Shortage",
                Priority = "High",
                Description = "Production Material Shortage",
                Status = "Shortage",
                DueDate = pr.ProductionPlan.PlannedStartDate,
                ReferenceId = pr.Id,
                ActionType = "View"
            })
            .ToListAsync(cancellationToken);

        needsAttention.AddRange(overduePOs);
        needsAttention.AddRange(approvalPRs);
        needsAttention.AddRange(inventoryAlerts);
        needsAttention.AddRange(productionShortages);

        var upcomingReceipts = await _context.PurchaseOrders
            .Where(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved)
            .Where(po => po.Items.Sum(i => i.Quantity) > 
                (_context.GoodsReceiptItems.Where(gri => gri.GoodsReceipt!.PurchaseOrderId == po.Id).Sum(gri => (decimal?)gri.ReceivedQuantity) ?? 0m))
            .OrderBy(po => po.ExpectedDeliveryDate)
            .Take(5)
            .Select(po => new ProcurementUpcomingReceiptDto
            {
                ReferenceId = po.Id,
                PONumber = po.PONumber,
                SupplierName = po.Supplier != null ? po.Supplier.SupplierName : "",
                ExpectedDeliveryDate = po.ExpectedDeliveryDate,
                TotalValue = po.TotalAmount,
                Status = po.ExpectedDeliveryDate.Date < now.Date ? "Overdue" : (po.ExpectedDeliveryDate.Date == now.Date ? "Due Today" : "Due Soon"),
                OutstandingQuantity = po.Items.Sum(i => i.Quantity) - (_context.GoodsReceiptItems.Where(gri => gri.GoodsReceipt!.PurchaseOrderId == po.Id).Sum(gri => (decimal?)gri.ReceivedQuantity) ?? 0m)
            })
            .ToListAsync(cancellationToken);

        var recentRequests = await _context.PurchaseRequests
            .OrderByDescending(pr => pr.RequestDate)
            .Take(5)
            .Select(pr => new ProcurementRecentRequestDto
            {
                ReferenceId = pr.Id,
                RequestNumber = pr.RequestNumber,
                Source = pr.Source.ToString(),
                Priority = pr.Priority.ToString(),
                Status = pr.Status.ToString(),
                RequiredByDate = pr.RequiredByDate,
                CreatedAt = pr.RequestDate
            })
            .ToListAsync(cancellationToken);

        var recentOrders = await _context.PurchaseOrders
            .OrderByDescending(po => po.OrderDate)
            .Take(5)
            .Select(po => new ProcurementRecentOrderDto
            {
                ReferenceId = po.Id,
                PONumber = po.PONumber,
                SupplierName = po.Supplier != null ? po.Supplier.SupplierName : "",
                Status = po.Status.ToString(),
                ExpectedDeliveryDate = po.ExpectedDeliveryDate,
                TotalAmount = po.TotalAmount,
                CreatedAt = po.OrderDate
            })
            .ToListAsync(cancellationToken);

        return new ProcurementSummaryDto
        {
            PendingPurchaseRequests = pendingPurchaseRequests,
            AwaitingApproval = awaitingApproval,
            OpenPurchaseOrders = openPurchaseOrders,
            PendingReceipts = pendingReceipts,
            OverdueReceipts = overdueReceipts,
            TotalProcurementValue = totalProcurementValue,
            NeedsAttention = needsAttention,
            UpcomingReceipts = upcomingReceipts,
            RecentRequests = recentRequests,
            RecentOrders = recentOrders
        };
    }

    public IQueryable<InventoryReportDto> GetInventoryReportQuery(Guid companyId)
    {
        return _context.Inventories.AsNoTracking()
            .Join(_context.Products, i => i.ProductId, p => p.Id, (i, p) => new InventoryReportDto
            {
                ProductId = p.Id,
                ProductName = p.Name,
                ProductCode = p.ProductCode,
                QuantityOnHand = i.QuantityOnHand,
                MinStockLevel = i.MinimumLevel,
                MaxStockLevel = i.MaximumLevel,
                CostPrice = p.CostPrice,
                TotalValue = i.QuantityOnHand * p.CostPrice,
                LastRestockDate = i.LastStockUpdate
            });
    }

    public IQueryable<ProductionReportDto> GetProductionReportQuery(Guid companyId)
    {
        return _context.ProductionOrders.AsNoTracking()
            .Join(_context.Products, po => po.ProductId, p => p.Id, (po, p) => new ProductionReportDto
            {
                OrderId = po.Id,
                OrderNumber = po.ProductionOrderNumber,
                ProductName = p.Name,
                Quantity = po.PlannedQuantity,
                StartDate = po.PlannedStartDate ?? DateTime.MinValue,
                EndDate = po.PlannedEndDate ?? DateTime.MinValue,
                Status = po.Status.ToString()
            });
    }

    public IQueryable<SalesReportDto> GetSalesReportQuery(Guid companyId)
    {
        return _context.SalesOrders.AsNoTracking()
            .Select(so => new SalesReportDto
            {
                OrderId = so.Id,
                OrderNumber = so.OrderNumber,
                CustomerName = so.Distributor != null ? so.Distributor.CompanyName : "N/A",
                OrderDate = so.OrderDate,
                TotalAmount = so.TotalAmount,
                Status = so.Status.ToString()
            });
    }

    public IQueryable<WarrantyReportDto> GetWarrantyReportQuery(Guid companyId)
    {
        return _context.Warranties.AsNoTracking()
            .Select(w => new WarrantyReportDto
            {
                WarrantyId = w.Id,
                ProductName = w.Product != null ? w.Product.Name : "N/A",
                SerialNumber = w.SerialNumber,
                StartDate = w.StartDate,
                EndDate = w.EndDate,
                Status = w.Status.ToString()
            });
    }

    public IQueryable<AuditReportDto> GetAuditReportQuery(Guid companyId)
    {
        return _context.AuditLogs
            .Select(a => new AuditReportDto
            {
                Id = a.Id,
                Action = a.Action,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                IpAddress = a.IpAddress,
                Timestamp = a.Timestamp,
                UserName = a.User != null ? a.User.FirstName + " " + a.User.LastName : string.Empty
            });
    }
}
