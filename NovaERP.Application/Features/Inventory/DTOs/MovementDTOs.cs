using System.ComponentModel.DataAnnotations;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.Inventory.DTOs;

public class ReceiveStockDto
{
    [Required] public Guid ProductId { get; set; }
    [Required] public Guid WarehouseId { get; set; }
    public Guid? LocationId { get; set; }
    [Required] [Range(0.01, double.MaxValue)] public decimal Quantity { get; set; }
    [Required] public InventoryReferenceType ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string Remarks { get; set; } = string.Empty;
}

public class IssueStockDto
{
    [Required] public Guid ProductId { get; set; }
    [Required] public Guid WarehouseId { get; set; }
    public Guid? LocationId { get; set; }
    [Required] [Range(0.01, double.MaxValue)] public decimal Quantity { get; set; }
    [Required] public InventoryReferenceType ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string Remarks { get; set; } = string.Empty;
}

public class ReserveStockDto
{
    [Required] public Guid ProductId { get; set; }
    [Required] public Guid WarehouseId { get; set; }
    public Guid? LocationId { get; set; }
    [Required] [Range(0.01, double.MaxValue)] public decimal Quantity { get; set; }
    [Required] public InventoryReferenceType ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string Remarks { get; set; } = string.Empty;
}

public class ReleaseReservationDto
{
    [Required] public Guid ProductId { get; set; }
    [Required] public Guid WarehouseId { get; set; }
    public Guid? LocationId { get; set; }
    [Required] [Range(0.01, double.MaxValue)] public decimal Quantity { get; set; }
    [Required] public InventoryReferenceType ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string Remarks { get; set; } = string.Empty;
}

public class AdjustStockDto
{
    [Required] public Guid ProductId { get; set; }
    [Required] public Guid WarehouseId { get; set; }
    public Guid? LocationId { get; set; }
    [Required] public decimal QuantityDelta { get; set; } // Can be negative or positive
    [Required] public string Reason { get; set; } = string.Empty;
}

public class TransferStockDto
{
    [Required] public Guid ProductId { get; set; }
    [Required] public Guid SourceWarehouseId { get; set; }
    public Guid? SourceLocationId { get; set; }
    [Required] public Guid DestinationWarehouseId { get; set; }
    public Guid? DestinationLocationId { get; set; }
    [Required] [Range(0.01, double.MaxValue)] public decimal Quantity { get; set; }
    [Required] public string Reason { get; set; } = string.Empty;
}
