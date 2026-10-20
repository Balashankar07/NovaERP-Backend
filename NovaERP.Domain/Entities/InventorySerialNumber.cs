using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class InventorySerialNumber : AuditableEntity
{
    public string SerialNumber { get; set; } = string.Empty;

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public Guid? WarehouseLocationId { get; set; }
    public WarehouseLocation? WarehouseLocation { get; set; }

    public Guid? BatchId { get; set; }
    public InventoryBatch? Batch { get; set; }

    public SerialStatus Status { get; set; } = SerialStatus.Available;

    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public DateTime? IssuedAt { get; set; }

    public InventoryReferenceType? CurrentReferenceType { get; set; }
    public Guid? CurrentReferenceId { get; set; }

    public string? Barcode { get; set; }
}
