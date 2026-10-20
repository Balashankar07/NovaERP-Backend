using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ReplacementOrder : AuditableEntity
{
    public string ReplacementNumber { get; set; } = string.Empty;

    public Guid CustomerReturnId { get; set; }
    public CustomerReturn? CustomerReturn { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public ReplacementStatus Status { get; set; } = ReplacementStatus.Pending;

    public Guid? ReservationId { get; set; }

    public Guid? ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }

    public string? Notes { get; set; }
}
