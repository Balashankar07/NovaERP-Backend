using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class SalesOrderItem : AuditableEntity
{
    public Guid SalesOrderId { get; set; }
    public Guid ProductId { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "ea";
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal Discount { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal Tax { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal ReservedQuantity { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal ShippedQuantity { get; set; }

    // Navigation Properties
    public SalesOrder? SalesOrder { get; set; }
    public Product? Product { get; set; }
}
