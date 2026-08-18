using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class GoodsReceipt : AuditableEntity
{
    public string GRNNumber { get; set; } = string.Empty;
    
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }
    
    public Guid SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    
    public DateTime ReceiptDate { get; set; }
    
    public GoodsReceiptStatus Status { get; set; } = GoodsReceiptStatus.Draft;
    
    public string? Remarks { get; set; }
    
    public Guid? ReceivedBy { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    // Warehouse Routing
    public Guid? WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
    
    public Guid? WarehouseLocationId { get; set; }
    public WarehouseLocation? WarehouseLocation { get; set; }
    
    public ICollection<GoodsReceiptItem> Items { get; set; } = new List<GoodsReceiptItem>();
}
