using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Finance.DTOs;
using NovaERP.Application.Interfaces.Services;
using System.Security.Claims;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FinanceController : ControllerBase
{
    private readonly IFinanceService _financeService;

    public FinanceController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    #region Summary / Overview

    [HttpGet("overview")]
    [HasPermission("Permissions.Finance.View")]
    public async Task<ActionResult<ApiResponse<FinanceSummaryDto>>> GetFinanceSummary(CancellationToken cancellationToken)
    {
        var result = await _financeService.GetFinanceSummaryAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    #endregion

    #region Chart of Accounts

    [HttpGet("chart-of-accounts")]
    [HasPermission("Permissions.Finance.ChartOfAccounts.View")]
    public async Task<ActionResult<ApiResponse<List<ChartOfAccountDto>>>> GetChartOfAccounts(CancellationToken cancellationToken)
    {
        var result = await _financeService.GetChartOfAccountsAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpPost("chart-of-accounts")]
    [HasPermission("Permissions.Finance.ChartOfAccounts.Manage")]
    public async Task<ActionResult<ApiResponse<ChartOfAccountDto>>> CreateChartOfAccount([FromBody] CreateChartOfAccountDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.CreateChartOfAccountAsync(dto, userId, cancellationToken);
        return CreatedAtAction(nameof(GetChartOfAccounts), ApiResponse.SuccessResponse("Account created successfully", result));
    }

    #endregion

    #region Customer Invoices

    [HttpGet("customer-invoices")]
    [HasPermission("Permissions.Finance.Invoices.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<CustomerInvoiceDto>>>> GetCustomerInvoices([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, CancellationToken cancellationToken = default)
    {
        var result = await _financeService.GetCustomerInvoicesAsync(pageNumber, pageSize, search, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpGet("customer-invoices/{id}")]
    [HasPermission("Permissions.Finance.Invoices.View")]
    public async Task<ActionResult<ApiResponse<CustomerInvoiceDto>>> GetCustomerInvoiceById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _financeService.GetCustomerInvoiceByIdAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpPost("customer-invoices")]
    [HasPermission("Permissions.Finance.Invoices.Create")]
    public async Task<ActionResult<ApiResponse<CustomerInvoiceDto>>> CreateCustomerInvoice([FromBody] CreateCustomerInvoiceDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.CreateCustomerInvoiceAsync(dto, userId, cancellationToken);
        return CreatedAtAction(nameof(GetCustomerInvoiceById), new { id = result.Id }, ApiResponse.SuccessResponse("Customer Invoice created successfully", result));
    }

    [HttpPost("customer-invoices/{id}/approve")]
    [HasPermission("Permissions.Finance.Invoices.Approve")]
    public async Task<ActionResult<ApiResponse<CustomerInvoiceDto>>> ApproveCustomerInvoice(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.ApproveCustomerInvoiceAsync(id, userId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Customer Invoice approved successfully", result));
    }

    [HttpPost("customer-invoices/{id}/cancel")]
    [HasPermission("Permissions.Finance.Invoices.Cancel")]
    public async Task<ActionResult<ApiResponse<CustomerInvoiceDto>>> CancelCustomerInvoice(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.CancelCustomerInvoiceAsync(id, userId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Customer Invoice cancelled successfully", result));
    }

    #endregion

    #region Supplier Invoices

    [HttpGet("supplier-invoices")]
    [HasPermission("Permissions.Finance.Invoices.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<SupplierInvoiceDto>>>> GetSupplierInvoices([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, CancellationToken cancellationToken = default)
    {
        var result = await _financeService.GetSupplierInvoicesAsync(pageNumber, pageSize, search, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpGet("supplier-invoices/{id}")]
    [HasPermission("Permissions.Finance.Invoices.View")]
    public async Task<ActionResult<ApiResponse<SupplierInvoiceDto>>> GetSupplierInvoiceById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _financeService.GetSupplierInvoiceByIdAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpPost("supplier-invoices")]
    [HasPermission("Permissions.Finance.Invoices.Create")]
    public async Task<ActionResult<ApiResponse<SupplierInvoiceDto>>> CreateSupplierInvoice([FromBody] CreateSupplierInvoiceDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.CreateSupplierInvoiceAsync(dto, userId, cancellationToken);
        return CreatedAtAction(nameof(GetSupplierInvoiceById), new { id = result.Id }, ApiResponse.SuccessResponse("Supplier Invoice created successfully", result));
    }

    [HttpPost("supplier-invoices/{id}/approve")]
    [HasPermission("Permissions.Finance.Invoices.Approve")]
    public async Task<ActionResult<ApiResponse<SupplierInvoiceDto>>> ApproveSupplierInvoice(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.ApproveSupplierInvoiceAsync(id, userId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Supplier Invoice approved successfully", result));
    }

    [HttpPost("supplier-invoices/{id}/cancel")]
    [HasPermission("Permissions.Finance.Invoices.Cancel")]
    public async Task<ActionResult<ApiResponse<SupplierInvoiceDto>>> CancelSupplierInvoice(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.CancelSupplierInvoiceAsync(id, userId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Supplier Invoice cancelled successfully", result));
    }

    #endregion

    #region Payments

    [HttpGet("payments")]
    [HasPermission("Permissions.Finance.Payments.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<PaymentDto>>>> GetPayments([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, CancellationToken cancellationToken = default)
    {
        var result = await _financeService.GetPaymentsAsync(pageNumber, pageSize, search, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpPost("payments")]
    [HasPermission("Permissions.Finance.Payments.Create")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> RecordPayment([FromBody] RecordPaymentDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.RecordPaymentAsync(dto, userId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Payment recorded successfully", result));
    }

    [HttpPost("payments/{id}/approve")]
    [HasPermission("Permissions.Finance.Payments.Approve")]
    public async Task<ActionResult<ApiResponse<PaymentDto>>> ApprovePayment(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.ApprovePaymentAsync(id, userId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Payment approved successfully", result));
    }

    #endregion

    #region AP / AR Summaries

    [HttpGet("accounts-payable")]
    [HasPermission("Permissions.Finance.AccountsPayable.View")]
    public async Task<ActionResult<ApiResponse<AccountsPayableSummaryDto>>> GetAccountsPayableSummary(CancellationToken cancellationToken)
    {
        var result = await _financeService.GetAccountsPayableSummaryAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpGet("accounts-receivable")]
    [HasPermission("Permissions.Finance.AccountsReceivable.View")]
    public async Task<ActionResult<ApiResponse<AccountsReceivableSummaryDto>>> GetAccountsReceivableSummary(CancellationToken cancellationToken)
    {
        var result = await _financeService.GetAccountsReceivableSummaryAsync(cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    #endregion

    #region General Ledger / Journals

    [HttpGet("journals")]
    [HasPermission("Permissions.Finance.GeneralLedger.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<JournalEntryDto>>>> GetJournalEntries([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, CancellationToken cancellationToken = default)
    {
        var result = await _financeService.GetJournalEntriesAsync(pageNumber, pageSize, search, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpGet("journals/{id}")]
    [HasPermission("Permissions.Finance.GeneralLedger.View")]
    public async Task<ActionResult<ApiResponse<JournalEntryDto>>> GetJournalEntryById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _financeService.GetJournalEntryByIdAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpPost("journals")]
    [HasPermission("Permissions.Finance.Journals.Create")]
    public async Task<ActionResult<ApiResponse<JournalEntryDto>>> CreateJournalEntry([FromBody] CreateJournalEntryDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.CreateJournalEntryAsync(dto, userId, cancellationToken);
        return CreatedAtAction(nameof(GetJournalEntryById), new { id = result.Id }, ApiResponse.SuccessResponse("Journal Entry created successfully", result));
    }

    [HttpPost("journals/{id}/post")]
    [HasPermission("Permissions.Finance.Journals.Post")]
    public async Task<ActionResult<ApiResponse<JournalEntryDto>>> PostJournalEntry(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _financeService.PostJournalEntryAsync(id, userId, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Journal Entry posted successfully", result));
    }

    #endregion
}
