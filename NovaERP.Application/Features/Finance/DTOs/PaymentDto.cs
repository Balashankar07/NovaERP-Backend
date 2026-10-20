using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.Finance.DTOs;

public class PaymentDto
{
    public Guid Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public PaymentType Type { get; set; }
    public Guid? CustomerInvoiceId { get; set; }
    public string? CustomerInvoiceNumber { get; set; }
    public Guid? SupplierInvoiceId { get; set; }
    public string? SupplierInvoiceNumber { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }
    public PaymentStatus Status { get; set; }
}

public class RecordPaymentDto
{
    public PaymentType Type { get; set; }
    public Guid? CustomerInvoiceId { get; set; }
    public Guid? SupplierInvoiceId { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;
    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }
}
