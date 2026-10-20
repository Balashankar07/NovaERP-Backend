using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ScrapRecord : AuditableEntity
{
    public string ScrapNumber { get; set; } = string.Empty;
    public Guid QualityInspectionId { get; set; }
    public Guid? NcrId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? BatchId { get; set; }
    public Guid? SerialNumberId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid? WarehouseLocationId { get; set; }
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;

    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ScrapDate { get; set; }
    public ScrapStatus Status { get; set; } = ScrapStatus.Pending;
    public string? Remarks { get; set; }

    // Navigation properties
    public QualityInspection? QualityInspection { get; set; }
    public NonConformanceReport? NonConformanceReport { get; set; }
    public Product? Product { get; set; }
    public Warehouse? Warehouse { get; set; }
    public WarehouseLocation? WarehouseLocation { get; set; }
    public InventoryBatch? Batch { get; set; }
    public InventorySerialNumber? SerialNumber { get; set; }
    public User? ApprovedByUser { get; set; }
}
