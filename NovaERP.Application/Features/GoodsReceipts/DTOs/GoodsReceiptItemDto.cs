namespace NovaERP.Application.Features.GoodsReceipts.DTOs;

public class GoodsReceiptItemDto
{
    public Guid Id { get; set; }
    public Guid GoodsReceiptId { get; set; }
    public Guid PurchaseOrderItemId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public decimal OrderedQuantity { get; set; }
    public decimal ReceivedQuantity { get; set; }
    public decimal RejectedQuantity { get; set; }
    public string? Remarks { get; set; }
    public Guid? QualityInspectionId { get; set; }
    public string? QualityInspectionStatus { get; set; }
    public decimal InspectedQuantity { get; set; }
    public decimal PassedQuantity { get; set; }
    public decimal FailedQuantity { get; set; }
}
