using System;
using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class DeliveryChallanItem : AuditableEntity
{
    public Guid DeliveryChallanId { get; set; }
    public DeliveryChallan? DeliveryChallan { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid SalesOrderItemId { get; set; }
    public SalesOrderItem? SalesOrderItem { get; set; }

    public Guid? BatchId { get; set; }
    public InventoryBatch? Batch { get; set; }

    public Guid? SerialNumberId { get; set; }
    public InventorySerialNumber? SerialNumber { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    public string UnitOfMeasure { get; set; } = "PCS";
}
