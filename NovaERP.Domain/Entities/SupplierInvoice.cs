using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class SupplierInvoice : AuditableEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid? PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }

    public Guid? GoodsReceiptId { get; set; }
    public GoodsReceipt? GoodsReceipt { get; set; }

    public Guid SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;

    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }

    public decimal SubTotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }

    public decimal AmountPaid { get; set; }
    public decimal BalanceDue { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public string? Notes { get; set; }

    public ICollection<SupplierInvoiceItem> Items { get; set; } = new List<SupplierInvoiceItem>();
}
