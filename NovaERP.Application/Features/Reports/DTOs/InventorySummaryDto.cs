namespace NovaERP.Application.Features.Reports.DTOs;

public class InventorySummaryDto
{
    public int TotalProductsInStock { get; set; }
    public decimal TotalOnHandQuantity { get; set; }
    public decimal TotalReservedQuantity { get; set; }
    public decimal TotalAvailableQuantity { get; set; }
    public int LowStockItems { get; set; }
    public int OutOfStockItems { get; set; }
    public int WarehouseCount { get; set; }
    public int RecentMovementCount { get; set; }
}
