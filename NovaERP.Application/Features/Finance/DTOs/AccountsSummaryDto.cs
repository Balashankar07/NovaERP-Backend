namespace NovaERP.Application.Features.Finance.DTOs;

public class AccountsPayableSummaryDto
{
    public decimal TotalOutstanding { get; set; }
    public decimal TotalPaid { get; set; }
    public int PendingInvoicesCount { get; set; }
    public decimal OverdueAmount { get; set; }
    public List<SupplierInvoiceDto> Invoices { get; set; } = new();
}

public class AccountsReceivableSummaryDto
{
    public decimal TotalOutstanding { get; set; }
    public decimal TotalCollected { get; set; }
    public int PendingInvoicesCount { get; set; }
    public decimal OverdueAmount { get; set; }
    public List<CustomerInvoiceDto> Invoices { get; set; } = new();
}
