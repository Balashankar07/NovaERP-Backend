using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class SalesOrder : AuditableEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid DistributorId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? RequiredDeliveryDate { get; set; }
    public SalesOrderStatus Status { get; set; } = SalesOrderStatus.Draft;
    
    public string Currency { get; set; } = "USD";
    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }
    
    public string? ShippingAddress { get; set; }
    public string? BillingAddress { get; set; }
    public string? Remarks { get; set; }
    
    // Navigation Properties
    public Distributor? Distributor { get; set; }
    public ICollection<SalesOrderItem> SalesOrderItems { get; set; } = new List<SalesOrderItem>();
    public ICollection<InventoryReservation> InventoryReservations { get; set; } = new List<InventoryReservation>();
}
