namespace NovaERP.Application.Features.QualityInspections.DTOs;

public class QualityInspectionDto
{
    public Guid Id { get; set; }
    public string InspectionNumber { get; set; } = string.Empty;
    public Guid? ProductionExecutionId { get; set; }
    public string? ProductionExecutionNumber { get; set; }
    public Guid? GoodsReceiptId { get; set; }
    public string? GoodsReceiptNumber { get; set; }
    public Guid? GoodsReceiptItemId { get; set; }
    public string InspectionType { get; set; } = "Production";
    public Guid? SourceWarehouseLocationId { get; set; }
    public string? SourceWarehouseLocationName { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductCode { get; set; }
    public decimal InspectedQuantity { get; set; }
    public decimal PassedQuantity { get; set; }
    public decimal FailedQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? InspectorId { get; set; }
    public string? InspectorName { get; set; }
    public DateTime? InspectionDate { get; set; }
    public string? Remarks { get; set; }
    public Guid? OutputWarehouseId { get; set; }
    public string? OutputWarehouseName { get; set; }
    public Guid? OutputWarehouseLocationId { get; set; }
    public string? OutputWarehouseLocationName { get; set; }

    public ICollection<QualityDefectDto> QualityDefects { get; set; } = new List<QualityDefectDto>();
}
