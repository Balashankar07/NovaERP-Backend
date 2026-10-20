using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class Payment : AuditableEntity
{
    public string PaymentNumber { get; set; } = string.Empty;
    public PaymentType Type { get; set; }

    public Guid? CustomerInvoiceId { get; set; }
    public CustomerInvoice? CustomerInvoice { get; set; }

    public Guid? SupplierInvoiceId { get; set; }
    public SupplierInvoice? SupplierInvoice { get; set; }

    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;
    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Recorded;
}
