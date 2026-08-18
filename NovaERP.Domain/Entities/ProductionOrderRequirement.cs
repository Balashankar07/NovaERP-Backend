using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class ProductionOrderRequirement : AuditableEntity
{
    public Guid ProductionOrderId { get; set; }
    public ProductionOrder ProductionOrder { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid? UnitId { get; set; }
    public Unit? Unit { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RequiredQuantity { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal ConsumedQuantity { get; set; }

    [NotMapped]
    public decimal RemainingQuantity => RequiredQuantity - ConsumedQuantity;

    public ICollection<InventoryReservation> Reservations { get; set; } = new List<InventoryReservation>();
}
