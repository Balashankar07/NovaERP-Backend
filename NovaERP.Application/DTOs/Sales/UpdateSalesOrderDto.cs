using System.ComponentModel.DataAnnotations;

namespace NovaERP.Application.DTOs.Sales;

public class UpdateSalesOrderDto
{
    [Required]
    public Guid DistributorId { get; set; }

    public DateTime? RequiredDeliveryDate { get; set; }
    
    [MaxLength(3)]
    public string Currency { get; set; } = "USD";
    
    [MaxLength(500)]
    public string? ShippingAddress { get; set; }
    
    [MaxLength(500)]
    public string? BillingAddress { get; set; }
    
    [MaxLength(1000)]
    public string? Remarks { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one item is required in the sales order.")]
    public List<CreateSalesOrderItemDto> Items { get; set; } = new List<CreateSalesOrderItemDto>();
}
