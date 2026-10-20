using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Finance.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface IFinanceService
{
    // Overview / Reports
    Task<FinanceSummaryDto> GetFinanceSummaryAsync(CancellationToken cancellationToken = default);

    // Chart of Accounts
    Task<List<ChartOfAccountDto>> GetChartOfAccountsAsync(CancellationToken cancellationToken = default);
    Task<ChartOfAccountDto> CreateChartOfAccountAsync(CreateChartOfAccountDto dto, Guid userId, CancellationToken cancellationToken = default);

    // Customer Invoices
    Task<PagedResult<CustomerInvoiceDto>> GetCustomerInvoicesAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default);
    Task<CustomerInvoiceDto> GetCustomerInvoiceByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CustomerInvoiceDto> CreateCustomerInvoiceAsync(CreateCustomerInvoiceDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<CustomerInvoiceDto> ApproveCustomerInvoiceAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<CustomerInvoiceDto> CancelCustomerInvoiceAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    // Supplier Invoices
    Task<PagedResult<SupplierInvoiceDto>> GetSupplierInvoicesAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default);
    Task<SupplierInvoiceDto> GetSupplierInvoiceByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SupplierInvoiceDto> CreateSupplierInvoiceAsync(CreateSupplierInvoiceDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<SupplierInvoiceDto> ApproveSupplierInvoiceAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<SupplierInvoiceDto> CancelSupplierInvoiceAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    // Payments
    Task<PagedResult<PaymentDto>> GetPaymentsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default);
    Task<PaymentDto> RecordPaymentAsync(RecordPaymentDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<PaymentDto> ApprovePaymentAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    // AP / AR
    Task<AccountsPayableSummaryDto> GetAccountsPayableSummaryAsync(CancellationToken cancellationToken = default);
    Task<AccountsReceivableSummaryDto> GetAccountsReceivableSummaryAsync(CancellationToken cancellationToken = default);

    // General Ledger / Journal Entries
    Task<PagedResult<JournalEntryDto>> GetJournalEntriesAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default);
    Task<JournalEntryDto> GetJournalEntryByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<JournalEntryDto> CreateJournalEntryAsync(CreateJournalEntryDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<JournalEntryDto> PostJournalEntryAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
}
