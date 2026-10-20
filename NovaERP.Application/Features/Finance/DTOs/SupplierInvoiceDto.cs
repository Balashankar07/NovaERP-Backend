using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.Finance.DTOs;

public class SupplierInvoiceItemDto
{
    public Guid Id { get; set; }
    public Guid? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class SupplierInvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid? PurchaseOrderId { get; set; }
    public string? PurchaseOrderNumber { get; set; }
    public Guid? GoodsReceiptId { get; set; }
    public string? GoodsReceiptNumber { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal BalanceDue { get; set; }
    public InvoiceStatus Status { get; set; }
    public string? Notes { get; set; }
    public List<SupplierInvoiceItemDto> Items { get; set; } = new();
}

public class CreateSupplierInvoiceItemDto
{
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class CreateSupplierInvoiceDto
{
    public string? InvoiceNumber { get; set; }
    public Guid? PurchaseOrderId { get; set; }
    public Guid? GoodsReceiptId { get; set; }
    public Guid SupplierId { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(30);
    public decimal TaxRate { get; set; } = 0;
    public string? Notes { get; set; }
    public List<CreateSupplierInvoiceItemDto> Items { get; set; } = new();
}
