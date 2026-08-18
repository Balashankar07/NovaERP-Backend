using System.ComponentModel.DataAnnotations;

namespace NovaERP.Application.Features.GoodsReceipts.DTOs;

public class CreateGoodsReceiptDto
{
    [Required]
    public Guid PurchaseOrderId { get; set; }
    
    public Guid? WarehouseId { get; set; }
    public Guid? WarehouseLocationId { get; set; }
    
    public string? Remarks { get; set; }
    
    [Required]
    [MinLength(1, ErrorMessage = "At least one item is required.")]
    public List<CreateGoodsReceiptItemDto> Items { get; set; } = new();
}
