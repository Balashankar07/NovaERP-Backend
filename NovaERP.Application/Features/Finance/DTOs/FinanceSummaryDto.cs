namespace NovaERP.Application.Features.Finance.DTOs;

public class FinanceSummaryDto
{
    public decimal TotalAccountsReceivable { get; set; }
    public decimal TotalAccountsPayable { get; set; }
    public decimal TotalCashAndBank { get; set; }
    public decimal NetSalesRevenue { get; set; }
    public decimal TotalCostOfGoodsSold { get; set; }
    public decimal TotalOperatingExpenses { get; set; }
    public int PendingCustomerInvoicesCount { get; set; }
    public int PendingSupplierInvoicesCount { get; set; }
    public int TotalJournalEntriesCount { get; set; }
}
