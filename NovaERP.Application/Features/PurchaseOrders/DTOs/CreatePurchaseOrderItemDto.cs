using System.ComponentModel.DataAnnotations;

namespace NovaERP.Application.Features.PurchaseOrders.DTOs;

public class CreatePurchaseOrderItemDto
{
    [Required]
    public Guid ProductId { get; set; }
    
    public Guid? PurchaseRequestItemId { get; set; }
    
    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than 0.")]
    public decimal Quantity { get; set; }
    
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Unit price must be non-negative.")]
    public decimal UnitPrice { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Discount must be non-negative.")]
    public decimal Discount { get; set; }
    
    [Range(0, double.MaxValue, ErrorMessage = "Tax must be non-negative.")]
    public decimal Tax { get; set; }
    
    public string? Remarks { get; set; }
}
