using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class CustomerInvoice : AuditableEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid? SalesOrderId { get; set; }
    public SalesOrder? SalesOrder { get; set; }

    public Guid? CustomerId { get; set; }
    public Distributor? Customer { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerAddress { get; set; }

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

    public ICollection<CustomerInvoiceItem> Items { get; set; } = new List<CustomerInvoiceItem>();
}
