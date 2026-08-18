namespace NovaERP.Application.Features.Reports.DTOs;

public class DashboardSummaryDto
{
    public int TotalProducts { get; set; }
    public int TotalSuppliers { get; set; }
    public int TotalWarehouses { get; set; }
    public decimal TotalInventoryValue { get; set; }
    public int OpenPurchaseOrders { get; set; }
    public int CompletedProductionOrders { get; set; }
    public int PendingQualityInspections { get; set; }
    public decimal SalesThisMonth { get; set; }
    public int ShipmentsPending { get; set; }
    public int ActiveWarranties { get; set; }
    public int OpenWarrantyClaims { get; set; }
    public List<ProductionChartDto> MonthlyProduction { get; set; } = new();
}
