using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.Inventory.DTOs;

public class HierarchicalLocationDto
{
    public Guid Id { get; set; }
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public Guid? ParentLocationId { get; set; }
    public string? ParentLocationName { get; set; }
    public LocationType Type { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string? Zone { get; set; }
    public string? Rack { get; set; }
    public string? Shelf { get; set; }
    public string? Bin { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public List<HierarchicalLocationDto> ChildLocations { get; set; } = new();
}

public class CreateHierarchicalLocationDto
{
    public Guid WarehouseId { get; set; }
    public Guid? ParentLocationId { get; set; }
    public LocationType Type { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string? Zone { get; set; }
    public string? Rack { get; set; }
    public string? Shelf { get; set; }
    public string? Bin { get; set; }
    public string? Description { get; set; }
}

public class InventoryBatchDto
{
    public Guid Id { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public Guid? WarehouseLocationId { get; set; }
    public string? LocationName { get; set; }
    public DateTime? ManufactureDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal QuantityOnHand { get; set; }
    public decimal QuantityReserved { get; set; }
    public decimal QuantityAvailable { get; set; }
    public BatchStatus Status { get; set; }
    public string? Barcode { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateInventoryBatchDto
{
    public string BatchNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid? WarehouseLocationId { get; set; }
    public DateTime? ManufactureDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal InitialQuantity { get; set; }
}

public class UpdateBatchStatusDto
{
    public BatchStatus Status { get; set; }
    public string? Remarks { get; set; }
}

public class InventorySerialNumberDto
{
    public Guid Id { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public Guid? WarehouseLocationId { get; set; }
    public string? LocationName { get; set; }
    public Guid? BatchId { get; set; }
    public string? BatchNumber { get; set; }
    public SerialStatus Status { get; set; }
    public DateTime ReceivedAt { get; set; }
    public DateTime? IssuedAt { get; set; }
    public InventoryReferenceType? CurrentReferenceType { get; set; }
    public Guid? CurrentReferenceId { get; set; }
    public string? Barcode { get; set; }
}

public class RegisterSerialNumbersDto
{
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid? WarehouseLocationId { get; set; }
    public Guid? BatchId { get; set; }
    public List<string> SerialNumbers { get; set; } = new();
}

public class UpdateSerialStatusDto
{
    public SerialStatus Status { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateProductTrackingModeDto
{
    public TrackingMode TrackingMode { get; set; }
}

public class TraceabilityNodeDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public TrackingMode TrackingMode { get; set; }
    public List<InventoryBatchDto> Batches { get; set; } = new();
    public List<InventorySerialNumberDto> Serials { get; set; } = new();
    public List<TraceabilityMovementDto> Movements { get; set; } = new();
}

public class TraceabilityMovementDto
{
    public Guid Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string ReferenceType { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public decimal Quantity { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Remarks { get; set; }
}

public class TraceabilityReportsSummaryDto
{
    public int TotalHierarchicalLocations { get; set; }
    public int TotalActiveBatches { get; set; }
    public int TotalExpiredBatches { get; set; }
    public int TotalBlockedBatches { get; set; }
    public int TotalAvailableSerials { get; set; }
    public int TotalIssuedSerials { get; set; }
    public int TotalDamagedSerials { get; set; }
    public List<LocationStockSummaryDto> StockByLocation { get; set; } = new();
}

public class LocationStockSummaryDto
{
    public string WarehouseName { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string LocationCode { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public decimal TotalQuantityOnHand { get; set; }
}
