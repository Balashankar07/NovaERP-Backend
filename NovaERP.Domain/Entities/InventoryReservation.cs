using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class InventoryReservation : AuditableEntity
{
    public Guid ProductionOrderId { get; set; }
    public ProductionOrder ProductionOrder { get; set; } = null!;

    public Guid ProductionOrderRequirementId { get; set; }
    public ProductionOrderRequirement ProductionOrderRequirement { get; set; } = null!;

    public Guid InventoryId { get; set; }
    public Inventory Inventory { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;

    public Guid? WarehouseLocationId { get; set; }
    public WarehouseLocation? WarehouseLocation { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal QuantityReserved { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal QuantityConsumed { get; set; }

    public ReservationStatus Status { get; set; } = ReservationStatus.Active;

    public DateTime? ReleasedAt { get; set; }
}
