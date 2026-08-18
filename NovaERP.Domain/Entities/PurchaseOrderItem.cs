using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class PurchaseOrderItem : AuditableEntity
{
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }
    
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
    
    public Guid? PurchaseRequestItemId { get; set; }
    public PurchaseRequestItem? PurchaseRequestItem { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Discount { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Tax { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal? SupplierUnitPrice { get; set; }
    
    public string? Remarks { get; set; }
}
