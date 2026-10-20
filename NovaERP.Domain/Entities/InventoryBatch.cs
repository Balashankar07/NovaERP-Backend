using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class InventoryBatch : AuditableEntity
{
    public string BatchNumber { get; set; } = string.Empty;

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public Guid? WarehouseLocationId { get; set; }
    public WarehouseLocation? WarehouseLocation { get; set; }

    public DateTime? ManufactureDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal QuantityOnHand { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal QuantityReserved { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal QuantityAvailable { get; set; }

    public BatchStatus Status { get; set; } = BatchStatus.Active;

    public string? Barcode { get; set; }

    // Navigation
    public ICollection<InventorySerialNumber> SerialNumbers { get; set; } = new List<InventorySerialNumber>();
}
