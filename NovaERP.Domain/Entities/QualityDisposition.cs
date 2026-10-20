using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class QualityDisposition : AuditableEntity
{
    public string DispositionNumber { get; set; } = string.Empty;
    public Guid QualityInspectionId { get; set; }
    public Guid? NcrId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }

    public Guid WarehouseId { get; set; }
    public Guid? WarehouseLocationId { get; set; }
    public Guid? BatchId { get; set; }
    public Guid? SerialNumberId { get; set; }

    public QualityDispositionType DispositionType { get; set; }
    public string Reason { get; set; } = string.Empty;

    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public DispositionStatus Status { get; set; } = DispositionStatus.Pending;

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
