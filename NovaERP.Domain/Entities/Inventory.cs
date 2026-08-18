using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class Inventory : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public Guid? WarehouseLocationId { get; set; }
    public WarehouseLocation? WarehouseLocation { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal QuantityOnHand { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal QuantityReserved { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal QuantityAvailable { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ReorderLevel { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MinimumLevel { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MaximumLevel { get; set; }

    public DateTime LastStockUpdate { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<InventoryTransaction> Transactions { get; set; } = new List<InventoryTransaction>();

    // Concurrency Token (mapped to PostgreSQL xmin)
    public uint Version { get; set; }
}
