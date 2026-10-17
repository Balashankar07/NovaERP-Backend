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
            .Select(po => new { 
                Date = po.ActualEndDate ?? po.ActualStartDate ?? po.PlannedStartDate ?? po.CreatedAt, 
                Quantity = po.CompletedQuantity > 0 ? po.CompletedQuantity : po.PlannedQuantity 
            })
            .Where(x => x.Date >= sixMonthsAgo)
            .ToListAsync(cancellationToken);

        var monthlyData = recentProduction
            .GroupBy(po => new { po.Date.Year, po.Date.Month })
            .Select(g => new ProductionChartDto
            {
                Name = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                Units = (int)g.Sum(po => po.Quantity)
            })
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
            .CountAsync(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved || 
                              po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Sent || 
                              po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PartiallyReceived, cancellationToken);

        var pendingReceipts = await _context.PurchaseOrders
            .Where(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved || 
                         po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Sent || 
                         po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PartiallyReceived)
            .CountAsync(po => po.Items.Sum(i => i.Quantity) > 
                (_context.GoodsReceiptItems.Where(gri => gri.GoodsReceipt!.PurchaseOrderId == po.Id).Sum(gri => (decimal?)gri.ReceivedQuantity) ?? 0m), cancellationToken);

        var overdueReceipts = await _context.PurchaseOrders
            .Where(po => (po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved || 
                          po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Sent || 
                          po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PartiallyReceived) && 
                         po.ExpectedDeliveryDate.Date < now.Date)
            .CountAsync(po => po.Items.Sum(i => i.Quantity) > 
                (_context.GoodsReceiptItems.Where(gri => gri.GoodsReceipt!.PurchaseOrderId == po.Id).Sum(gri => (decimal?)gri.ReceivedQuantity) ?? 0m), cancellationToken);

        var totalProcurementValue = await _context.PurchaseOrders
            .Where(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved || 
                         po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Sent || 
                         po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PartiallyReceived)
            .SumAsync(po => po.TotalAmount, cancellationToken);

        var needsAttention = new List<ProcurementAttentionItemDto>();

        var overduePOs = await _context.PurchaseOrders
            .Where(po => (po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved || 
                          po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Sent || 
                          po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PartiallyReceived) && 
                         po.ExpectedDeliveryDate.Date < now.Date)
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
            .Where(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Approved || 
                         po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.Sent || 
                         po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PartiallyReceived)
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

        var approvedPurchaseRequests = await _context.PurchaseRequests
            .CountAsync(pr => pr.Status == NovaERP.Domain.Enums.PurchaseRequestStatus.Approved, cancellationToken);

        var partiallyReceivedOrders = await _context.PurchaseOrders
            .CountAsync(po => po.Status == NovaERP.Domain.Enums.PurchaseOrderStatus.PartiallyReceived, cancellationToken);

        var activeSuppliersCount = await _context.Suppliers
            .CountAsync(s => s.IsActive, cancellationToken);

        var inactiveSuppliers = await _context.Suppliers
            .CountAsync(s => !s.IsActive, cancellationToken);

        var supplierIssuesCount = inactiveSuppliers + overduePOs.Count;

        var prStatusGroups = await _context.PurchaseRequests
            .GroupBy(pr => pr.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, cancellationToken);

        var poStatusGroups = await _context.PurchaseOrders
            .GroupBy(po => po.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, cancellationToken);

        return new ProcurementSummaryDto
        {
            PendingPurchaseRequests = pendingPurchaseRequests,
            AwaitingApproval = awaitingApproval,
            ApprovedPurchaseRequests = approvedPurchaseRequests,
            OpenPurchaseOrders = openPurchaseOrders,
            PendingReceipts = pendingReceipts,
            PartiallyReceivedOrders = partiallyReceivedOrders,
            OverdueReceipts = overdueReceipts,
            ActiveSuppliersCount = activeSuppliersCount,
            SupplierIssuesCount = supplierIssuesCount,
            TotalProcurementValue = totalProcurementValue,
            PrPipeline = prStatusGroups,
            PoPipeline = poStatusGroups,
            NeedsAttention = needsAttention,
            UpcomingReceipts = upcomingReceipts,
            RecentRequests = recentRequests,
            RecentOrders = recentOrders
        };
    }

    public async Task<ProductionSummaryDto> GetProductionSummaryAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var productionPlansCount = await _context.ProductionPlans
            .CountAsync(cancellationToken);

        var activeProductionOrders = await _context.ProductionOrders
            .CountAsync(po => po.Status == NovaERP.Domain.Enums.ProductionOrderStatus.Released || 
                              po.Status == NovaERP.Domain.Enums.ProductionOrderStatus.InProgress, cancellationToken);

        var pendingExecutions = await _context.ProductionExecutions
            .CountAsync(pe => pe.Status == NovaERP.Domain.Enums.ProductionExecutionStatus.Draft || 
                              pe.Status == NovaERP.Domain.Enums.ProductionExecutionStatus.Started, cancellationToken);

        var materialShortagesCount = await _context.ProductionRequirements
            .Where(pr => pr.ShortageQuantity > 0 && 
                         pr.ProductionPlan.Status != NovaERP.Domain.Enums.ProductionPlanStatus.Cancelled && 
                         pr.ProductionPlan.Status != NovaERP.Domain.Enums.ProductionPlanStatus.Completed)
            .CountAsync(cancellationToken);

        var ordersInProgress = await _context.ProductionOrders
            .CountAsync(po => po.Status == NovaERP.Domain.Enums.ProductionOrderStatus.InProgress, cancellationToken);

        var awaitingQualityCount = await _context.QualityInspections
            .CountAsync(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.Draft || 
                              qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.InProgress, cancellationToken);

        var completedProductionCount = await _context.ProductionOrders
            .CountAsync(po => po.Status == NovaERP.Domain.Enums.ProductionOrderStatus.Completed, cancellationToken);

        var totalProducedQuantity = await _context.ProductionExecutions
            .Where(pe => pe.Status == NovaERP.Domain.Enums.ProductionExecutionStatus.Completed)
            .SumAsync(pe => (decimal?)pe.ProducedQuantity, cancellationToken) ?? 0m;

        var totalPlannedQuantity = await _context.ProductionOrders
            .SumAsync(po => (decimal?)po.PlannedQuantity, cancellationToken) ?? 0m;

        var totalRejectedQuantity = await _context.ProductionExecutions
            .Where(pe => pe.Status == NovaERP.Domain.Enums.ProductionExecutionStatus.Completed)
            .SumAsync(pe => (decimal?)pe.RejectedQuantity, cancellationToken) ?? 0m;

        decimal wastePercentage = 0m;
        if (totalProducedQuantity > 0)
        {
            wastePercentage = Math.Round((totalRejectedQuantity / totalProducedQuantity) * 100m, 2);
        }

        var planPipeline = await _context.ProductionPlans
            .GroupBy(pp => pp.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, cancellationToken);

        var orderPipeline = await _context.ProductionOrders
            .GroupBy(po => po.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, cancellationToken);

        var activeOrdersList = await _context.ProductionOrders
            .Include(po => po.Product)
            .Include(po => po.BOM)
            .Include(po => po.Requirements)
            .Where(po => po.Status == NovaERP.Domain.Enums.ProductionOrderStatus.Released || 
                         po.Status == NovaERP.Domain.Enums.ProductionOrderStatus.InProgress || 
                         po.Status == NovaERP.Domain.Enums.ProductionOrderStatus.Draft)
            .OrderByDescending(po => po.CreatedAt)
            .Take(6)
            .ToListAsync(cancellationToken);

        var productIds = activeOrdersList.SelectMany(po => po.Requirements.Select(r => r.ProductId)).Distinct().ToList();
        var inventoryAvailable = await _context.Inventories
            .Where(i => productIds.Contains(i.ProductId))
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Available = g.Sum(i => i.QuantityAvailable) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Available, cancellationToken);

        var materialReadiness = new List<ProductionMaterialReadinessDto>();
        foreach (var po in activeOrdersList)
        {
            decimal requiredQty = po.Requirements.Sum(r => r.RequiredQuantity);
            decimal availableQty = 0m;
            foreach (var req in po.Requirements)
            {
                if (inventoryAvailable.TryGetValue(req.ProductId, out var avail))
                {
                    availableQty += Math.Min(req.RequiredQuantity, avail);
                }
            }

            decimal shortageQty = Math.Max(0m, requiredQty - availableQty);

            string state = "READY";
            if (shortageQty > 0 && availableQty > 0) state = "PARTIALLY AVAILABLE";
            else if (shortageQty > 0 && availableQty == 0) state = "INSUFFICIENT";
            else if (requiredQty > 0 && availableQty >= requiredQty) state = "READY";

            materialReadiness.Add(new ProductionMaterialReadinessDto
            {
                ProductionOrderId = po.Id,
                OrderNumber = po.ProductionOrderNumber,
                ProductCode = po.Product?.ProductCode ?? "",
                ProductName = po.Product?.Name ?? "",
                PlannedQuantity = po.PlannedQuantity,
                BomName = po.BOM != null ? $"BOM v{po.BOM.Version}" : "Standard BOM",
                RequiredComponentQuantity = requiredQty,
                AvailableComponentQuantity = availableQty,
                ShortageQuantity = shortageQty,
                ReadinessState = state
            });
        }

        var awaitingQualityInspections = await _context.QualityInspections
            .Include(qi => qi.ProductionExecution)
                .ThenInclude(pe => pe!.ProductionOrder)
            .Include(qi => qi.Product)
            .Where(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.Draft || 
                         qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.InProgress)
            .OrderByDescending(qi => qi.CreatedAt)
            .Take(5)
            .Select(qi => new ProductionAwaitingQualityDto
            {
                ProductionExecutionId = qi.ProductionExecutionId ?? Guid.Empty,
                ExecutionNumber = qi.ProductionExecution != null ? qi.ProductionExecution.ExecutionNumber : "",
                ProductionOrderNumber = qi.ProductionExecution != null && qi.ProductionExecution.ProductionOrder != null ? qi.ProductionExecution.ProductionOrder.ProductionOrderNumber : "",
                ProductCode = qi.Product != null ? qi.Product.ProductCode : "",
                ProductName = qi.Product != null ? qi.Product.Name : "",
                ProducedQuantity = qi.InspectedQuantity,
                InspectionStatus = qi.Status.ToString(),
                CompletedAt = qi.CreatedAt,
                QualityInspectionId = qi.Id
            })
            .ToListAsync(cancellationToken);

        var needsAttention = new List<ProductionAttentionItemDto>();

        var shortages = await _context.ProductionRequirements
            .Include(pr => pr.Product)
            .Include(pr => pr.ProductionPlan)
            .Where(pr => pr.ShortageQuantity > 0 && 
                         pr.ProductionPlan.Status != NovaERP.Domain.Enums.ProductionPlanStatus.Cancelled && 
                         pr.ProductionPlan.Status != NovaERP.Domain.Enums.ProductionPlanStatus.Completed)
            .OrderByDescending(pr => pr.ShortageQuantity)
            .Take(5)
            .Select(pr => new ProductionAttentionItemDto
            {
                Reference = pr.Product != null ? pr.Product.ProductCode : "",
                Type = "Material Shortage",
                Priority = "High",
                Description = $"Shortage: {pr.ShortageQuantity} units for {(pr.Product != null ? pr.Product.Name : "Product")}",
                Status = "Shortage",
                DueDate = pr.ProductionPlan != null ? pr.ProductionPlan.PlannedStartDate : null,
                ReferenceId = pr.Id,
                ActionType = "View"
            })
            .ToListAsync(cancellationToken);

        var awaitingInspectionsAlerts = awaitingQualityInspections.Select(qi => new ProductionAttentionItemDto
        {
            Reference = qi.ExecutionNumber,
            Type = "Awaiting Quality",
            Priority = "Medium",
            Description = $"{qi.ProductName} ({qi.ProducedQuantity} units) awaiting quality inspection",
            Status = qi.InspectionStatus,
            DueDate = qi.CompletedAt,
            ReferenceId = qi.QualityInspectionId ?? qi.ProductionExecutionId,
            ActionType = "Quality"
        }).ToList();

        needsAttention.AddRange(shortages);
        needsAttention.AddRange(awaitingInspectionsAlerts);

        var recentOrders = await _context.ProductionOrders
            .Include(po => po.Product)
            .OrderByDescending(po => po.CreatedAt)
            .Take(5)
            .Select(po => new RecentProductionOrderDto
            {
                ReferenceId = po.Id,
                OrderNumber = po.ProductionOrderNumber,
                ProductCode = po.Product != null ? po.Product.ProductCode : "",
                ProductName = po.Product != null ? po.Product.Name : "",
                PlannedQuantity = po.PlannedQuantity,
                CompletedQuantity = po.CompletedQuantity,
                Status = po.Status.ToString(),
                CreatedAt = po.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var recentExecutions = await _context.ProductionExecutions
            .Include(pe => pe.ProductionOrder)
            .OrderByDescending(pe => pe.CreatedAt)
            .Take(5)
            .Select(pe => new RecentProductionExecutionDto
            {
                ReferenceId = pe.Id,
                ExecutionNumber = pe.ExecutionNumber,
                OrderNumber = pe.ProductionOrder != null ? pe.ProductionOrder.ProductionOrderNumber : "",
                ProducedQuantity = pe.ProducedQuantity,
                RejectedQuantity = pe.RejectedQuantity,
                Status = pe.Status.ToString(),
                CreatedAt = pe.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new ProductionSummaryDto
        {
            ProductionPlansCount = productionPlansCount,
            ActiveProductionOrders = activeProductionOrders,
            PendingExecutions = pendingExecutions,
            MaterialShortagesCount = materialShortagesCount,
            OrdersInProgress = ordersInProgress,
            AwaitingQualityCount = awaitingQualityCount,
            CompletedProductionCount = completedProductionCount,
            TotalProducedQuantity = totalProducedQuantity,
            TotalPlannedQuantity = totalPlannedQuantity,
            TotalRejectedQuantity = totalRejectedQuantity,
            WastePercentage = wastePercentage,
            PlanPipeline = planPipeline,
            OrderPipeline = orderPipeline,
            MaterialReadiness = materialReadiness,
            AwaitingQualityInspections = awaitingQualityInspections,
            NeedsAttention = needsAttention,
            RecentOrders = recentOrders,
            RecentExecutions = recentExecutions
        };
    }

    public async Task<QualitySummaryDto> GetQualitySummaryAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var pendingCount = await _context.QualityInspections
            .CountAsync(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.Draft || qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.InProgress, cancellationToken);

        var inProgressCount = await _context.QualityInspections
            .CountAsync(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.InProgress, cancellationToken);

        var passedCount = await _context.QualityInspections
            .CountAsync(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.Passed, cancellationToken);

        var partiallyPassedCount = await _context.QualityInspections
            .CountAsync(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.PartiallyPassed, cancellationToken);

        var failedCount = await _context.QualityInspections
            .CountAsync(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.Failed, cancellationToken);

        var totalDefectsCount = await _context.QualityDefects
            .SumAsync(d => (decimal?)d.Quantity, cancellationToken) ?? 0;

        var totalAcceptedQty = await _context.QualityInspections
            .Where(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.Passed || qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.PartiallyPassed)
            .SumAsync(qi => (decimal?)qi.PassedQuantity, cancellationToken) ?? 0;

        var totalRejectedQty = await _context.QualityInspections
            .SumAsync(qi => (decimal?)qi.FailedQuantity, cancellationToken) ?? 0;

        var statusCountsRaw = await _context.QualityInspections
            .GroupBy(qi => qi.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToListAsync(cancellationToken);

        var statusCounts = Enum.GetNames(typeof(NovaERP.Domain.Enums.QualityInspectionStatus))
            .ToDictionary(name => name, name => statusCountsRaw.FirstOrDefault(x => x.Status == name)?.Count ?? 0);

        var completedInspectionsCount = passedCount + partiallyPassedCount + failedCount;
        var passRate = completedInspectionsCount > 0
            ? Math.Round((decimal)(passedCount + partiallyPassedCount) / completedInspectionsCount * 100, 1)
            : 0;
        var failureRate = completedInspectionsCount > 0
            ? Math.Round((decimal)failedCount / completedInspectionsCount * 100, 1)
            : 0;

        // Inspection Queue
        var queueRaw = await _context.QualityInspections
            .AsNoTracking()
            .Include(qi => qi.Product)
            .Include(qi => qi.ProductionExecution)
                .ThenInclude(pe => pe!.ProductionOrder)
            .Include(qi => qi.OutputWarehouse)
            .Where(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.Draft || qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.InProgress)
            .OrderByDescending(qi => qi.CreatedAt)
            .Take(15)
            .ToListAsync(cancellationToken);

        var queue = queueRaw.Select(qi => new QualityInspectionQueueDto
        {
            Id = qi.Id,
            InspectionNumber = qi.InspectionNumber,
            ProductionOrderNumber = qi.ProductionExecution?.ProductionOrder?.ProductionOrderNumber ?? "N/A",
            ExecutionNumber = qi.ProductionExecution?.ExecutionNumber ?? "N/A",
            ProductId = qi.ProductId,
            ProductName = qi.Product?.Name ?? "Product",
            InspectedQuantity = qi.InspectedQuantity,
            Status = qi.Status.ToString(),
            CreatedAt = qi.CreatedAt,
            OutputWarehouseName = qi.OutputWarehouse?.WarehouseName ?? "Main Warehouse"
        }).ToList();

        // Defect Analysis
        var defectsRaw = await _context.QualityDefects
            .AsNoTracking()
            .Include(qd => qd.QualityInspection)
                .ThenInclude(qi => qi!.Product)
            .GroupBy(qd => new { qd.DefectCode, qd.DefectName, qd.Severity })
            .Select(g => new
            {
                g.Key.DefectCode,
                g.Key.DefectName,
                g.Key.Severity,
                TotalQty = g.Sum(x => x.Quantity),
                Count = g.Count(),
                ProductName = g.Select(x => x.QualityInspection != null && x.QualityInspection.Product != null ? x.QualityInspection.Product.Name : "General").FirstOrDefault() ?? "General"
            })
            .OrderByDescending(x => x.TotalQty)
            .Take(10)
            .ToListAsync(cancellationToken);

        var defectAnalysis = defectsRaw.Select(d => new QualityDefectAnalysisDto
        {
            DefectCode = d.DefectCode,
            DefectName = d.DefectName,
            ProductName = d.ProductName,
            Severity = d.Severity ?? "Medium",
            TotalQuantity = d.TotalQty,
            OccurrenceCount = d.Count
        }).ToList();

        // Release Log
        var releaseLogRaw = await _context.QualityInspections
            .AsNoTracking()
            .Include(qi => qi.Product)
            .Include(qi => qi.ProductionExecution)
            .Include(qi => qi.OutputWarehouse)
            .Where(qi => qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.Passed || qi.Status == NovaERP.Domain.Enums.QualityInspectionStatus.PartiallyPassed)
            .OrderByDescending(qi => qi.InspectionDate ?? qi.UpdatedAt ?? qi.CreatedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        var releaseLog = releaseLogRaw.Select(qi => new QualityReleaseLogDto
        {
            InspectionId = qi.Id,
            InspectionNumber = qi.InspectionNumber,
            ProductName = qi.Product?.Name ?? "Product",
            ExecutionNumber = qi.ProductionExecution?.ExecutionNumber ?? "N/A",
            PassedQuantity = qi.PassedQuantity,
            Status = qi.Status.ToString(),
            CompletedDate = qi.InspectionDate ?? qi.UpdatedAt,
            WarehouseName = qi.OutputWarehouse?.WarehouseName ?? "Finished Goods Warehouse"
        }).ToList();

        // Attention Items
        var attentionItems = new List<QualityAttentionItemDto>();

        if (pendingCount > 0)
        {
            attentionItems.Add(new QualityAttentionItemDto
            {
                Id = "att-1",
                Title = $"{pendingCount} Pending Quality Inspections",
                Message = "Production executions completed on shop floor require Quality decision before FG release.",
                Severity = pendingCount > 5 ? "high" : "medium",
                Type = "PendingInspections",
                LinkUrl = "/quality"
            });
        }

        if (inProgressCount > 0)
        {
            attentionItems.Add(new QualityAttentionItemDto
            {
                Id = "att-2",
                Title = $"{inProgressCount} Inspections Currently In Progress",
                Message = "Quality Engineers are actively evaluating shop floor samples.",
                Severity = "medium",
                Type = "InProgressInspections",
                LinkUrl = "/quality"
            });
        }

        if (failedCount > 0)
        {
            attentionItems.Add(new QualityAttentionItemDto
            {
                Id = "att-3",
                Title = $"{failedCount} Failed Quality Inspections",
                Message = "Rejections recorded on production executions. Review root-cause defect analysis.",
                Severity = "high",
                Type = "FailedInspections",
                LinkUrl = "/quality"
            });
        }

        if (totalDefectsCount > 0)
        {
            attentionItems.Add(new QualityAttentionItemDto
            {
                Id = "att-4",
                Title = $"{totalDefectsCount} Total Defects Logged",
                Message = "Defect instances recorded across recent quality evaluation runs.",
                Severity = "medium",
                Type = "HighDefects",
                LinkUrl = "/quality"
            });
        }

        // Recent Activity
        var recentInspections = await _context.QualityInspections
            .AsNoTracking()
            .Include(qi => qi.Product)
            .OrderByDescending(qi => qi.UpdatedAt ?? qi.CreatedAt)
            .Take(5)
            .ToListAsync(cancellationToken);

        var recentActivity = recentInspections.Select(qi => new RecentQualityActivityDto
        {
            Id = qi.Id.ToString(),
            InspectionNumber = qi.InspectionNumber,
            Action = $"Inspection {qi.Status}",
            ProductName = qi.Product?.Name ?? "Product",
            Status = qi.Status.ToString(),
            Timestamp = qi.UpdatedAt ?? qi.CreatedAt
        }).ToList();

        return new QualitySummaryDto
        {
            PendingInspectionsCount = pendingCount,
            InProgressInspectionsCount = inProgressCount,
            PassedInspectionsCount = passedCount,
            PartiallyPassedInspectionsCount = partiallyPassedCount,
            FailedInspectionsCount = failedCount,
            TotalDefectsCount = totalDefectsCount,
            TotalAcceptedQuantity = totalAcceptedQty,
            TotalRejectedQuantity = totalRejectedQty,
            PassRatePercentage = passRate,
            FailureRatePercentage = failureRate,
            StatusCounts = statusCounts,
            InspectionQueue = queue,
            DefectAnalysis = defectAnalysis,
            ReleaseLog = releaseLog,
            AttentionItems = attentionItems,
            RecentActivity = recentActivity
        };
    }

    public async Task<SalesSummaryDto> GetSalesSummaryAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var draftCount = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Draft, cancellationToken);

        var pendingApprovalCount = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.PendingApproval, cancellationToken);

        var approvedCount = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Approved, cancellationToken);

        var reservedCount = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Reserved, cancellationToken);

        var readyToShipCount = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.ReadyToShip, cancellationToken);

        var partiallyShippedCount = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.PartiallyShipped, cancellationToken);

        var completedCount = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Completed, cancellationToken);

        var openOrdersCount = await _context.SalesOrders
            .CountAsync(so => so.Status != NovaERP.Domain.Enums.SalesOrderStatus.Completed &&
                              so.Status != NovaERP.Domain.Enums.SalesOrderStatus.Cancelled &&
                              so.Status != NovaERP.Domain.Enums.SalesOrderStatus.Rejected, cancellationToken);

        var totalSalesValue = await _context.SalesOrders
            .SumAsync(so => (decimal?)so.TotalAmount, cancellationToken) ?? 0;

        var completedSalesValue = await _context.SalesOrders
            .Where(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Completed)
            .SumAsync(so => (decimal?)so.TotalAmount, cancellationToken) ?? 0;

        var openSalesValue = await _context.SalesOrders
            .Where(so => so.Status != NovaERP.Domain.Enums.SalesOrderStatus.Completed &&
                         so.Status != NovaERP.Domain.Enums.SalesOrderStatus.Cancelled &&
                         so.Status != NovaERP.Domain.Enums.SalesOrderStatus.Rejected)
            .SumAsync(so => (decimal?)so.TotalAmount, cancellationToken) ?? 0;

        var activeReservationsCount = await _context.InventoryReservations
            .CountAsync(r => r.QuantityReserved > r.QuantityConsumed, cancellationToken);

        var fgAvailableQty = await _context.Inventories
            .AsNoTracking()
            .Include(i => i.Product)
            .Where(i => i.Product != null && (i.Product.Type == NovaERP.Domain.Enums.ProductType.FinishedGood || (int)i.Product.Type == 0))
            .SumAsync(i => (decimal?)(i.QuantityOnHand - i.QuantityReserved), cancellationToken) ?? 0;

        var statusCountsRaw = await _context.SalesOrders
            .GroupBy(so => so.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToListAsync(cancellationToken);

        var statusCounts = Enum.GetNames(typeof(NovaERP.Domain.Enums.SalesOrderStatus))
            .ToDictionary(name => name, name => statusCountsRaw.FirstOrDefault(x => x.Status == name)?.Count ?? 0);

        // Finished Goods Availability List
        var fgListRaw = await _context.Inventories
            .AsNoTracking()
            .Include(i => i.Product)
            .Where(i => i.Product != null && (i.Product.Type == NovaERP.Domain.Enums.ProductType.FinishedGood || (int)i.Product.Type == 0))
            .OrderByDescending(i => i.QuantityOnHand)
            .Take(10)
            .ToListAsync(cancellationToken);

        var fgList = fgListRaw.Select(i => new FinishedGoodsAvailabilityDto
        {
            ProductId = i.ProductId,
            ProductCode = i.Product?.ProductCode ?? "FG",
            ProductName = i.Product?.Name ?? "Finished Good",
            QuantityOnHand = i.QuantityOnHand,
            QuantityReserved = i.QuantityReserved,
            QuantityAvailable = i.QuantityOnHand - i.QuantityReserved,
            UnitPrice = i.Product?.SellingPrice ?? 0
        }).ToList();

        // Active Reservations List
        var resListRaw = await _context.InventoryReservations
            .AsNoTracking()
            .Include(r => r.Product)
            .Include(r => r.SalesOrder)
            .Where(r => r.QuantityReserved > r.QuantityConsumed)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        var activeReservations = resListRaw.Select(r => new ActiveReservationDto
        {
            ReservationId = r.Id,
            SalesOrderNumber = r.SalesOrder?.OrderNumber ?? "N/A",
            ProductId = r.ProductId,
            ProductName = r.Product?.Name ?? "Product",
            ReservedQuantity = r.QuantityReserved - r.QuantityConsumed,
            Status = r.Status.ToString(),
            CreatedAt = r.CreatedAt,
            ExpiryDate = null
        }).ToList();

        // Ready To Ship Orders List
        var readyToShipRaw = await _context.SalesOrders
            .AsNoTracking()
            .Include(so => so.Distributor)
            .Include(so => so.SalesOrderItems)
                .ThenInclude(soi => soi.Product)
            .Where(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.ReadyToShip ||
                         so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Reserved ||
                         so.Status == NovaERP.Domain.Enums.SalesOrderStatus.PartiallyShipped)
            .OrderByDescending(so => so.OrderDate)
            .Take(10)
            .ToListAsync(cancellationToken);

        var readyToShipOrders = readyToShipRaw.Select(so => {
            var firstItem = so.SalesOrderItems.FirstOrDefault();
            var ordered = so.SalesOrderItems.Sum(i => i.Quantity);
            var shipped = so.SalesOrderItems.Sum(i => i.ShippedQuantity);
            return new ReadyToShipOrderDto
            {
                OrderId = so.Id,
                OrderNumber = so.OrderNumber,
                DistributorName = so.Distributor?.CompanyName ?? "Direct Customer",
                ProductName = firstItem?.Product?.Name ?? (so.SalesOrderItems.Count > 1 ? $"{so.SalesOrderItems.Count} Products" : "Product"),
                OrderedQuantity = ordered,
                ReservedQuantity = ordered,
                ShippedQuantity = shipped,
                RemainingQuantity = Math.Max(0, ordered - shipped),
                Status = so.Status.ToString(),
                OrderDate = so.OrderDate
            };
        }).ToList();

        // Top Distributors Activity
        var distributorsRaw = await _context.SalesOrders
            .AsNoTracking()
            .Include(so => so.Distributor)
            .Where(so => so.DistributorId != Guid.Empty)
            .GroupBy(so => new { so.DistributorId, so.Distributor!.CompanyName, so.Distributor.ContactPerson })
            .Select(g => new
            {
                g.Key.DistributorId,
                g.Key.CompanyName,
                ContactPerson = g.Key.ContactPerson ?? string.Empty,
                TotalOrders = g.Count(),
                TotalValue = g.Sum(x => x.TotalAmount)
            })
            .OrderByDescending(x => x.TotalValue)
            .Take(5)
            .ToListAsync(cancellationToken);

        var topDistributors = distributorsRaw.Select(d => new DistributorActivityDto
        {
            DistributorId = d.DistributorId,
            CompanyName = d.CompanyName,
            TotalOrders = d.TotalOrders,
            TotalOrderValue = d.TotalValue,
            ContactPerson = d.ContactPerson
        }).ToList();

        // Attention Items
        var attentionItems = new List<SalesAttentionItemDto>();

        if (pendingApprovalCount > 0)
        {
            attentionItems.Add(new SalesAttentionItemDto
            {
                Id = "s-att-1",
                Title = $"{pendingApprovalCount} Orders Awaiting Sales Approval",
                Message = "Submitted B2B sales orders pending manager review and approval.",
                Severity = pendingApprovalCount > 5 ? "high" : "medium",
                Type = "PendingApproval",
                LinkUrl = "/sales/orders"
            });
        }

        if (readyToShipCount > 0)
        {
            attentionItems.Add(new SalesAttentionItemDto
            {
                Id = "s-att-2",
                Title = $"{readyToShipCount} Orders Ready For Dispatch",
                Message = "Stock reserved; handed over to Warehouse / Distribution for physical shipment.",
                Severity = "medium",
                Type = "ReadyToShip",
                LinkUrl = "/sales/orders"
            });
        }

        if (partiallyShippedCount > 0)
        {
            attentionItems.Add(new SalesAttentionItemDto
            {
                Id = "s-att-3",
                Title = $"{partiallyShippedCount} Partially Shipped Sales Orders",
                Message = "Orders with partial shipments completed; awaiting final shipment dispatch.",
                Severity = "medium",
                Type = "PartiallyShipped",
                LinkUrl = "/sales/orders"
            });
        }

        if (draftCount > 0)
        {
            attentionItems.Add(new SalesAttentionItemDto
            {
                Id = "s-att-4",
                Title = $"{draftCount} Draft Sales Orders",
                Message = "Draft orders created by sales team requiring customer details and line items.",
                Severity = "low",
                Type = "DraftOrders",
                LinkUrl = "/sales/orders"
            });
        }

        // Recent Sales Activity
        var recentOrdersRaw = await _context.SalesOrders
            .AsNoTracking()
            .Include(so => so.Distributor)
            .OrderByDescending(so => so.UpdatedAt ?? so.CreatedAt)
            .Take(5)
            .ToListAsync(cancellationToken);

        var recentActivity = recentOrdersRaw.Select(so => new RecentSalesActivityDto
        {
            Id = so.Id.ToString(),
            OrderNumber = so.OrderNumber,
            Action = $"Order {so.Status}",
            DistributorName = so.Distributor?.CompanyName ?? "Direct Customer",
            TotalAmount = so.TotalAmount,
            Status = so.Status.ToString(),
            Timestamp = so.UpdatedAt ?? so.CreatedAt
        }).ToList();

        return new SalesSummaryDto
        {
            DraftOrdersCount = draftCount,
            PendingApprovalCount = pendingApprovalCount,
            ApprovedOrdersCount = approvedCount,
            ReservedOrdersCount = reservedCount,
            ReadyToShipCount = readyToShipCount,
            PartiallyShippedCount = partiallyShippedCount,
            CompletedOrdersCount = completedCount,
            AvailableFinishedGoodsQuantity = fgAvailableQty,
            OpenOrdersCount = openOrdersCount,
            ActiveReservationsCount = activeReservationsCount,
            TotalSalesValue = totalSalesValue,
            CompletedSalesValue = completedSalesValue,
            OpenSalesValue = openSalesValue,
            StatusCounts = statusCounts,
            FinishedGoodsAvailability = fgList,
            ActiveReservations = activeReservations,
            ReadyToShipOrders = readyToShipOrders,
            TopDistributors = topDistributors,
            AttentionItems = attentionItems,
            RecentActivity = recentActivity
        };
    }

    public async Task<DistributionSummaryDto> GetDistributionSummaryAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var readyToShipOrders = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.ReadyToShip ||
                              so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Reserved ||
                              so.Status == NovaERP.Domain.Enums.SalesOrderStatus.PartiallyShipped, cancellationToken);

        var draftShipments = await _context.Shipments
            .CountAsync(s => s.Status == NovaERP.Domain.Enums.ShipmentStatus.Pending, cancellationToken);

        var shipmentsReadyForDispatch = draftShipments;

        var partiallyShippedOrders = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.PartiallyShipped, cancellationToken);

        var dispatchedShipments = await _context.Shipments
            .CountAsync(s => s.Status == NovaERP.Domain.Enums.ShipmentStatus.Dispatched, cancellationToken);

        var completedOrders = await _context.SalesOrders
            .CountAsync(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Completed, cancellationToken);

        var unitsAwaitingDispatch = await _context.SalesOrderItems
            .Where(soi => soi.SalesOrder!.Status == NovaERP.Domain.Enums.SalesOrderStatus.ReadyToShip ||
                          soi.SalesOrder.Status == NovaERP.Domain.Enums.SalesOrderStatus.Reserved ||
                          soi.SalesOrder.Status == NovaERP.Domain.Enums.SalesOrderStatus.PartiallyShipped)
            .SumAsync(soi => (decimal?)(soi.Quantity - soi.ShippedQuantity), cancellationToken) ?? 0m;

        var totalFulfillmentValue = await _context.SalesOrders
            .Where(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.PartiallyShipped ||
                         so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Completed)
            .SumAsync(so => (decimal?)so.TotalAmount, cancellationToken) ?? 0m;

        var pipelineRaw = await _context.Shipments
            .GroupBy(s => s.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToListAsync(cancellationToken);

        var pipeline = Enum.GetNames(typeof(NovaERP.Domain.Enums.ShipmentStatus))
            .ToDictionary(name => name, name => pipelineRaw.FirstOrDefault(x => x.Status == name)?.Count ?? 0);

        // Ready To Ship Queue
        var queueRaw = await _context.SalesOrders
            .AsNoTracking()
            .Include(so => so.Distributor)
            .Include(so => so.SalesOrderItems)
            .Where(so => so.Status == NovaERP.Domain.Enums.SalesOrderStatus.ReadyToShip ||
                         so.Status == NovaERP.Domain.Enums.SalesOrderStatus.Reserved ||
                         so.Status == NovaERP.Domain.Enums.SalesOrderStatus.PartiallyShipped)
            .OrderByDescending(so => so.OrderDate)
            .Take(10)
            .ToListAsync(cancellationToken);

        var queue = queueRaw.Select(so => new ReadyToShipQueueItemDto
        {
            SalesOrderId = so.Id,
            SalesOrderNumber = so.OrderNumber,
            DistributorName = so.Distributor?.CompanyName ?? "B2B Distributor",
            OrderDate = so.OrderDate,
            RequiredDeliveryDate = so.RequiredDeliveryDate,
            Status = so.Status.ToString(),
            OrderedQuantity = so.SalesOrderItems.Sum(i => i.Quantity),
            ReservedQuantity = so.SalesOrderItems.Sum(i => i.ReservedQuantity),
            ShippedQuantity = so.SalesOrderItems.Sum(i => i.ShippedQuantity),
            RemainingQuantity = Math.Max(0, so.SalesOrderItems.Sum(i => i.Quantity - i.ShippedQuantity)),
            WarehouseName = "Main Warehouse",
            TotalAmount = so.TotalAmount
        }).ToList();

        // Inventory Visibility
        var invRaw = await _context.Inventories
            .AsNoTracking()
            .Include(i => i.Product)
            .Include(i => i.Warehouse)
            .Where(i => i.Product != null && (i.Product.Type == NovaERP.Domain.Enums.ProductType.FinishedGood || (int)i.Product.Type == 0))
            .OrderByDescending(i => i.QuantityOnHand)
            .Take(10)
            .ToListAsync(cancellationToken);

        var invVisibility = invRaw.Select(i => new DistributionInventoryVisibilityDto
        {
            ProductId = i.ProductId,
            ProductName = i.Product?.Name ?? "Finished Good",
            Sku = i.Product?.ProductCode ?? "N/A",
            WarehouseName = i.Warehouse?.WarehouseName ?? "Main Warehouse",
            QuantityOnHand = i.QuantityOnHand,
            QuantityReserved = i.QuantityReserved,
            QuantityAvailable = i.QuantityOnHand - i.QuantityReserved,
            IsLowStock = (i.QuantityOnHand - i.QuantityReserved) <= (i.Product?.ReorderLevel ?? 0)
        }).ToList();

        // Attention Items
        var attentionItems = new List<DistributionAttentionItemDto>();

        if (draftShipments > 0)
        {
            attentionItems.Add(new DistributionAttentionItemDto
            {
                Id = "d-att-1",
                Title = $"{draftShipments} Draft Shipments Awaiting Dispatch",
                Message = "Shipment records prepared by warehouse staff ready to be physically dispatched.",
                Severity = draftShipments > 5 ? "high" : "medium",
                Type = "DraftShipments",
                LinkUrl = "/shipments"
            });
        }

        if (readyToShipOrders > 0)
        {
            attentionItems.Add(new DistributionAttentionItemDto
            {
                Id = "d-att-2",
                Title = $"{readyToShipOrders} Orders Ready for Shipment Creation",
                Message = "Sales orders with active inventory reservations awaiting shipment creation.",
                Severity = "medium",
                Type = "ReadyToShipOrders",
                LinkUrl = "/sales/orders"
            });
        }

        if (partiallyShippedOrders > 0)
        {
            attentionItems.Add(new DistributionAttentionItemDto
            {
                Id = "d-att-3",
                Title = $"{partiallyShippedOrders} Partially Shipped Orders Outstanding",
                Message = "Orders with partial dispatches completed awaiting final shipment creation.",
                Severity = "medium",
                Type = "PartiallyShippedOrders",
                LinkUrl = "/sales/orders"
            });
        }

        // Recent Dispatches
        var recentDispatchesRaw = await _context.Shipments
            .AsNoTracking()
            .Include(s => s.SalesOrder)
                .ThenInclude(so => so!.Distributor)
            .Include(s => s.ShipmentItems)
            .OrderByDescending(s => s.DispatchDate ?? s.CreatedAt)
            .Take(5)
            .ToListAsync(cancellationToken);

        var recentDispatches = recentDispatchesRaw.Select(s => new RecentDispatchActivityDto
        {
            ShipmentId = s.Id,
            ShipmentNumber = string.IsNullOrWhiteSpace(s.TrackingNumber) ? $"SHP-{s.Id.ToString().Substring(0, 8)}" : s.TrackingNumber,
            SalesOrderNumber = s.SalesOrder?.OrderNumber ?? "N/A",
            DistributorName = s.SalesOrder?.Distributor?.CompanyName ?? "B2B Customer",
            CourierName = string.IsNullOrWhiteSpace(s.CourierName) ? "Standard Logistics" : s.CourierName,
            TotalQuantity = s.ShipmentItems.Sum(i => i.Quantity),
            DispatchDate = s.DispatchDate ?? s.CreatedAt,
            Status = s.Status.ToString()
        }).ToList();

        return new DistributionSummaryDto
        {
            ReadyToShipOrders = readyToShipOrders,
            DraftShipments = draftShipments,
            ShipmentsReadyForDispatch = shipmentsReadyForDispatch,
            PartiallyShippedOrders = partiallyShippedOrders,
            DispatchedShipments = dispatchedShipments,
            CompletedOrders = completedOrders,
            UnitsAwaitingDispatch = unitsAwaitingDispatch,
            TotalShipmentFulfillmentValue = totalFulfillmentValue,
            ShipmentPipeline = pipeline,
            ReadyToShipQueue = queue,
            InventoryVisibility = invVisibility,
            AttentionItems = attentionItems,
            RecentDispatches = recentDispatches
        };
    }

    public async Task<WarrantySummaryDto> GetWarrantySummaryAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var expiryThreshold = now.AddDays(30);

        var activeWarranties = await _context.Warranties
            .CountAsync(w => w.Status == NovaERP.Domain.Enums.WarrantyStatus.Active, cancellationToken);

        var expiringWarranties = await _context.Warranties
            .CountAsync(w => w.Status == NovaERP.Domain.Enums.WarrantyStatus.Active && w.EndDate <= expiryThreshold, cancellationToken);

        var activeClaims = await _context.WarrantyClaims
            .CountAsync(c => c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Pending ||
                             c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.UnderReview ||
                             c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Approved, cancellationToken);

        var pendingClaims = await _context.WarrantyClaims
            .CountAsync(c => c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Pending, cancellationToken);

        var underReviewClaims = await _context.WarrantyClaims
            .CountAsync(c => c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.UnderReview, cancellationToken);

        var approvedClaims = await _context.WarrantyClaims
            .CountAsync(c => c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Approved, cancellationToken);

        var resolvedClaims = await _context.WarrantyClaims
            .CountAsync(c => c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Resolved, cancellationToken);

        var rejectedClaims = await _context.WarrantyClaims
            .CountAsync(c => c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Rejected, cancellationToken);

        var closedClaims = await _context.WarrantyClaims
            .CountAsync(c => c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Closed, cancellationToken);

        var totalClaims = await _context.WarrantyClaims
            .CountAsync(cancellationToken);

        // Average Resolution Days calculation for resolved/closed claims
        var resolvedList = await _context.WarrantyClaims
            .Where(c => c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Resolved || c.Status == NovaERP.Domain.Enums.WarrantyClaimStatus.Closed)
            .Select(c => new { c.RequestDate, c.UpdatedAt, c.CreatedAt })
            .ToListAsync(cancellationToken);

        double averageResolutionDays = 0;
        if (resolvedList.Count > 0)
        {
            var totalDays = resolvedList.Sum(c => ((c.UpdatedAt ?? c.CreatedAt) - c.RequestDate).TotalDays);
            averageResolutionDays = Math.Round(Math.Max(0, totalDays / resolvedList.Count), 1);
        }

        // Claim Pipeline
        var rawPipeline = await _context.WarrantyClaims
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToListAsync(cancellationToken);

        var pipeline = new Dictionary<string, int>
        {
            { "Pending", 0 },
            { "UnderReview", 0 },
            { "Approved", 0 },
            { "Rejected", 0 },
            { "Resolved", 0 },
            { "Closed", 0 }
        };

        foreach (var p in rawPipeline)
        {
            if (pipeline.ContainsKey(p.Status))
            {
                pipeline[p.Status] = p.Count;
            }
        }

        // Expiring Queue
        var expiringRaw = await _context.Warranties
            .AsNoTracking()
            .Include(w => w.Product)
            .Include(w => w.Shipment)
                .ThenInclude(s => s!.SalesOrder)
                    .ThenInclude(so => so!.Distributor)
            .Include(w => w.WarrantyClaims)
            .Where(w => w.Status == NovaERP.Domain.Enums.WarrantyStatus.Active && w.EndDate <= now.AddDays(60))
            .OrderBy(w => w.EndDate)
            .Take(10)
            .ToListAsync(cancellationToken);

        var expiringQueue = expiringRaw.Select(w => new ExpiringWarrantyQueueItemDto
        {
            WarrantyId = w.Id,
            SerialNumber = w.SerialNumber,
            WarrantyType = w.WarrantyType,
            ProductId = w.ProductId,
            ProductName = w.Product?.Name ?? "N/A",
            ProductSku = w.Product?.ProductCode ?? "N/A",
            ShipmentId = w.ShipmentId,
            ShipmentNumber = string.IsNullOrWhiteSpace(w.Shipment?.TrackingNumber) ? $"SHP-{w.ShipmentId.ToString().Substring(0, 8)}" : w.Shipment.TrackingNumber,
            SalesOrderNumber = w.Shipment?.SalesOrder?.OrderNumber ?? "N/A",
            DistributorName = w.Shipment?.SalesOrder?.Distributor?.CompanyName ?? "Direct Customer",
            StartDate = w.StartDate,
            EndDate = w.EndDate,
            DaysRemaining = Math.Max(0, (int)(w.EndDate - now).TotalDays),
            ActiveClaimCount = w.WarrantyClaims.Count(c => c.Status != NovaERP.Domain.Enums.WarrantyClaimStatus.Closed && c.Status != NovaERP.Domain.Enums.WarrantyClaimStatus.Rejected),
            Status = w.Status.ToString()
        }).ToList();

        // Operational Claims Queue
        var claimsRaw = await _context.WarrantyClaims
            .AsNoTracking()
            .Include(c => c.Warranty)
                .ThenInclude(w => w!.Product)
            .Include(c => c.Warranty)
                .ThenInclude(w => w!.Shipment)
                    .ThenInclude(s => s!.SalesOrder)
                        .ThenInclude(so => so!.Distributor)
            .OrderByDescending(c => c.RequestDate)
            .Take(10)
            .ToListAsync(cancellationToken);

        var claimQueue = claimsRaw.Select(c => new WarrantyClaimQueueItemDto
        {
            ClaimId = c.Id,
            WarrantyId = c.WarrantyId,
            SerialNumber = c.Warranty?.SerialNumber ?? "N/A",
            ProductName = c.Warranty?.Product?.Name ?? "N/A",
            ProductSku = c.Warranty?.Product?.ProductCode ?? "N/A",
            DistributorName = c.Warranty?.Shipment?.SalesOrder?.Distributor?.CompanyName ?? "Direct Customer",
            SalesOrderNumber = c.Warranty?.Shipment?.SalesOrder?.OrderNumber ?? "N/A",
            ShipmentNumber = string.IsNullOrWhiteSpace(c.Warranty?.Shipment?.TrackingNumber) ? (c.Warranty != null ? $"SHP-{c.Warranty.ShipmentId.ToString().Substring(0, 8)}" : "N/A") : c.Warranty.Shipment.TrackingNumber,
            RequestDate = c.RequestDate,
            Complaint = c.Complaint,
            Resolution = c.Resolution,
            Status = c.Status.ToString(),
            WarrantyType = c.Warranty?.WarrantyType ?? "Standard",
            WarrantyEndDate = c.Warranty?.EndDate ?? DateTime.MinValue
        }).ToList();

        // Warranty Coverage Overview
        var coverageRaw = await _context.Warranties
            .AsNoTracking()
            .Include(w => w.Product)
            .Include(w => w.Shipment)
                .ThenInclude(s => s!.SalesOrder)
                    .ThenInclude(so => so!.Distributor)
            .Include(w => w.WarrantyClaims)
            .OrderByDescending(w => w.CreatedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        var coverageOverview = coverageRaw.Select(w => new WarrantyCoverageItemDto
        {
            WarrantyId = w.Id,
            SerialNumber = w.SerialNumber,
            WarrantyType = w.WarrantyType,
            ProductId = w.ProductId,
            ProductName = w.Product?.Name ?? "N/A",
            ProductSku = w.Product?.ProductCode ?? "N/A",
            DistributorName = w.Shipment?.SalesOrder?.Distributor?.CompanyName ?? "Direct Customer",
            SalesOrderNumber = w.Shipment?.SalesOrder?.OrderNumber ?? "N/A",
            ShipmentNumber = string.IsNullOrWhiteSpace(w.Shipment?.TrackingNumber) ? $"SHP-{w.ShipmentId.ToString().Substring(0, 8)}" : w.Shipment.TrackingNumber,
            StartDate = w.StartDate,
            EndDate = w.EndDate,
            DaysRemaining = Math.Max(0, (int)(w.EndDate - now).TotalDays),
            Status = w.Status.ToString(),
            TotalClaims = w.WarrantyClaims.Count
        }).ToList();

        // Operational Attention Items
        var attentionItems = new List<WarrantyAttentionItemDto>();

        if (pendingClaims > 0)
        {
            attentionItems.Add(new WarrantyAttentionItemDto
            {
                Id = "w-att-1",
                Title = $"{pendingClaims} Pending Warranty Claims Requiring Review",
                Message = "New customer warranty claims received that require initial evaluation.",
                Severity = pendingClaims > 3 ? "high" : "medium",
                Type = "PendingClaims",
                LinkUrl = "/warranties/claims"
            });
        }

        if (expiringWarranties > 0)
        {
            attentionItems.Add(new WarrantyAttentionItemDto
            {
                Id = "w-att-2",
                Title = $"{expiringWarranties} Warranties Expiring Within 30 Days",
                Message = "Active product warranties approaching expiration window.",
                Severity = "low",
                Type = "ExpiringWarranties",
                LinkUrl = "/warranties"
            });
        }

        if (underReviewClaims > 0)
        {
            attentionItems.Add(new WarrantyAttentionItemDto
            {
                Id = "w-att-3",
                Title = $"{underReviewClaims} Claims Under Technical Investigation",
                Message = "Claims currently under technical diagnosis awaiting approval/rejection decision.",
                Severity = "medium",
                Type = "UnderReviewClaims",
                LinkUrl = "/warranties/claims"
            });
        }

        // Recent Activity
        var recentActivity = claimsRaw.Take(5).Select(c => new WarrantyRecentActivityDto
        {
            ClaimId = c.Id,
            WarrantyId = c.WarrantyId,
            SerialNumber = c.Warranty?.SerialNumber ?? "N/A",
            ProductName = c.Warranty?.Product?.Name ?? "N/A",
            DistributorName = c.Warranty?.Shipment?.SalesOrder?.Distributor?.CompanyName ?? "Direct Customer",
            Complaint = c.Complaint,
            Resolution = c.Resolution,
            Status = c.Status.ToString(),
            ActivityDate = c.RequestDate
        }).ToList();

        return new WarrantySummaryDto
        {
            ActiveWarranties = activeWarranties,
            ExpiringWarranties = expiringWarranties,
            ActiveClaims = activeClaims,
            PendingClaims = pendingClaims,
            UnderReviewClaims = underReviewClaims,
            ApprovedClaims = approvedClaims,
            ResolvedClaims = resolvedClaims,
            RejectedClaims = rejectedClaims,
            ClosedClaims = closedClaims,
            TotalClaims = totalClaims,
            AverageResolutionDays = averageResolutionDays,
            ClaimPipeline = pipeline,
            ExpiringQueue = expiringQueue,
            ClaimQueue = claimQueue,
            CoverageOverview = coverageOverview,
            AttentionItems = attentionItems,
            RecentActivity = recentActivity
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
                Quantity = po.CompletedQuantity > 0 ? po.CompletedQuantity : po.PlannedQuantity,
                StartDate = po.ActualStartDate ?? po.PlannedStartDate ?? po.CreatedAt,
                EndDate = po.ActualEndDate ?? po.PlannedEndDate ?? po.CreatedAt,
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
