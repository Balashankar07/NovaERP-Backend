using NovaERP.Domain.Enums;

namespace NovaERP.Application.DTOs.Sales;

public class SalesOrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid DistributorId { get; set; }
    public string DistributorName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime? RequiredDeliveryDate { get; set; }
    public SalesOrderStatus Status { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? ShippingAddress { get; set; }
    public string? BillingAddress { get; set; }
    public string? Remarks { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? ApprovedByName { get; set; }
    
    public List<SalesOrderItemDto> Items { get; set; } = new List<SalesOrderItemDto>();
}
