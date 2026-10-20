using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Finance.DTOs;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class FinanceService : IFinanceService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;

    public FinanceService(AppDbContext context, IAuditLogger auditLogger)
    {
        _context = context;
        _auditLogger = auditLogger;
    }

    #region Summary / Overview

    public async Task<FinanceSummaryDto> GetFinanceSummaryAsync(CancellationToken cancellationToken = default)
    {
        var arInvoices = await _context.CustomerInvoices.Where(x => x.Status != InvoiceStatus.Cancelled).ToListAsync(cancellationToken);
        var apInvoices = await _context.SupplierInvoices.Where(x => x.Status != InvoiceStatus.Cancelled).ToListAsync(cancellationToken);

        var totalAr = arInvoices.Sum(x => x.BalanceDue);
        var totalAp = apInvoices.Sum(x => x.BalanceDue);
        var netSales = arInvoices.Where(x => x.Status == InvoiceStatus.Approved || x.Status == InvoiceStatus.Paid || x.Status == InvoiceStatus.PartiallyPaid).Sum(x => x.SubTotal);

        var postedJournals = await _context.JournalEntries
            .Include(j => j.Lines)
            .Where(j => j.Status == JournalStatus.Posted)
            .ToListAsync(cancellationToken);

        decimal cashBalance = 0;
        decimal cogs = 0;
        decimal operatingExpenses = 0;

        foreach (var j in postedJournals)
        {
            foreach (var l in j.Lines)
            {
                if (l.AccountCode == "1010") cashBalance += (l.Debit - l.Credit);
                else if (l.AccountCode == "5000") cogs += (l.Debit - l.Credit);
                else if (l.AccountCode == "6000") operatingExpenses += (l.Debit - l.Credit);
            }
        }

        return new FinanceSummaryDto
        {
            TotalAccountsReceivable = totalAr,
            TotalAccountsPayable = totalAp,
            TotalCashAndBank = cashBalance,
            NetSalesRevenue = netSales,
            TotalCostOfGoodsSold = cogs,
            TotalOperatingExpenses = operatingExpenses,
            PendingCustomerInvoicesCount = arInvoices.Count(x => x.Status == InvoiceStatus.Draft || x.Status == InvoiceStatus.Approved),
            PendingSupplierInvoicesCount = apInvoices.Count(x => x.Status == InvoiceStatus.Draft || x.Status == InvoiceStatus.Approved),
            TotalJournalEntriesCount = await _context.JournalEntries.CountAsync(cancellationToken)
        };
    }

    #endregion

    #region Chart of Accounts

    public async Task<List<ChartOfAccountDto>> GetChartOfAccountsAsync(CancellationToken cancellationToken = default)
    {
        var accounts = await _context.ChartOfAccounts.OrderBy(a => a.AccountCode).ToListAsync(cancellationToken);
        var postedLines = await _context.JournalEntryLines
            .Where(l => l.JournalEntry.Status == JournalStatus.Posted)
            .ToListAsync(cancellationToken);

        var balanceMap = postedLines
            .GroupBy(l => l.AccountId)
            .ToDictionary(g => g.Key, g => g.Sum(l => l.Debit - l.Credit));

        return accounts.Select(a => new ChartOfAccountDto
        {
            Id = a.Id,
            AccountCode = a.AccountCode,
            AccountName = a.AccountName,
            Type = a.Type,
            Description = a.Description,
            IsActive = a.IsActive,
            CurrentBalance = balanceMap.TryGetValue(a.Id, out var bal) ? bal : 0
        }).ToList();
    }

    public async Task<ChartOfAccountDto> CreateChartOfAccountAsync(CreateChartOfAccountDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (await _context.ChartOfAccounts.AnyAsync(a => a.AccountCode == dto.AccountCode, cancellationToken))
        {
            throw new InvalidOperationException($"Chart of Account with code '{dto.AccountCode}' already exists.");
        }

        var account = new ChartOfAccount
        {
            AccountCode = dto.AccountCode,
            AccountName = dto.AccountName,
            Type = dto.Type,
            Description = dto.Description,
            IsActive = true
        };

        _context.ChartOfAccounts.Add(account);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CREATE_ACCOUNT", "ChartOfAccount", account.Id.ToString(), "", $"Created account {account.AccountCode} - {account.AccountName}");

        return new ChartOfAccountDto
        {
            Id = account.Id,
            AccountCode = account.AccountCode,
            AccountName = account.AccountName,
            Type = account.Type,
            Description = account.Description,
            IsActive = account.IsActive,
            CurrentBalance = 0
        };
    }

    #endregion

    #region Customer Invoices

    public async Task<PagedResult<CustomerInvoiceDto>> GetCustomerInvoicesAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.CustomerInvoices
            .Include(x => x.Customer)
            .Include(x => x.SalesOrder)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x => x.InvoiceNumber.ToLower().Contains(term) || x.CustomerName.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToCustomerInvoiceDto).ToList();
        return new PagedResult<CustomerInvoiceDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<CustomerInvoiceDto> GetCustomerInvoiceByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var inv = await _context.CustomerInvoices
            .Include(x => x.Customer)
            .Include(x => x.SalesOrder)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (inv == null) throw new KeyNotFoundException($"Customer Invoice {id} not found.");
        return MapToCustomerInvoiceDto(inv);
    }

    public async Task<CustomerInvoiceDto> CreateCustomerInvoiceAsync(CreateCustomerInvoiceDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var number = string.IsNullOrWhiteSpace(dto.InvoiceNumber)
            ? $"INV-CUST-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"
            : dto.InvoiceNumber.Trim();

        if (await _context.CustomerInvoices.AnyAsync(x => x.InvoiceNumber == number, cancellationToken))
        {
            throw new InvalidOperationException($"Duplicate Invoice Number '{number}' already exists.");
        }

        if (dto.Items == null || !dto.Items.Any())
        {
            throw new InvalidOperationException("Customer Invoice must contain at least one line item.");
        }

        foreach (var item in dto.Items)
        {
            if (item.Quantity <= 0) throw new InvalidOperationException("Line item quantity must be greater than 0.");
            if (item.UnitPrice < 0) throw new InvalidOperationException("Line item unit price cannot be negative.");
        }

        decimal subtotal = dto.Items.Sum(i => i.Quantity * i.UnitPrice);
        decimal taxAmount = Math.Round(subtotal * (dto.TaxRate / 100m), 2);
        decimal total = subtotal + taxAmount;

        var invoice = new CustomerInvoice
        {
            InvoiceNumber = number,
            SalesOrderId = dto.SalesOrderId,
            CustomerId = dto.CustomerId,
            CustomerName = string.IsNullOrWhiteSpace(dto.CustomerName) ? "Direct Customer" : dto.CustomerName.Trim(),
            CustomerAddress = dto.CustomerAddress,
            InvoiceDate = dto.InvoiceDate,
            DueDate = dto.DueDate,
            SubTotal = subtotal,
            TaxRate = dto.TaxRate,
            TaxAmount = taxAmount,
            TotalAmount = total,
            AmountPaid = 0,
            BalanceDue = total,
            Status = InvoiceStatus.Draft,
            Notes = dto.Notes
        };

        foreach (var i in dto.Items)
        {
            invoice.Items.Add(new CustomerInvoiceItem
            {
                ProductId = i.ProductId,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                LineTotal = i.Quantity * i.UnitPrice
            });
        }

        _context.CustomerInvoices.Add(invoice);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CREATE_CUSTOMER_INVOICE", "CustomerInvoice", invoice.Id.ToString(), "", $"Created customer invoice {invoice.InvoiceNumber}");

        return MapToCustomerInvoiceDto(invoice);
    }

    public async Task<CustomerInvoiceDto> ApproveCustomerInvoiceAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var inv = await _context.CustomerInvoices
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (inv == null) throw new KeyNotFoundException($"Customer Invoice {id} not found.");
        if (inv.Status != InvoiceStatus.Draft)
        {
            throw new InvalidOperationException($"Cannot approve customer invoice in status '{inv.Status}'.");
        }

        inv.Status = InvoiceStatus.Approved;
        await _context.SaveChangesAsync(cancellationToken);

        // Auto GL Entry: Debit AR (1100), Credit Sales Revenue (4000), Credit Tax Payable (2100)
        await CreateAndPostJournalForCustomerInvoiceAsync(inv, userId, cancellationToken);

        await _auditLogger.LogAsync("APPROVE_CUSTOMER_INVOICE", "CustomerInvoice", inv.Id.ToString(), "", $"Approved customer invoice {inv.InvoiceNumber}");

        return MapToCustomerInvoiceDto(inv);
    }

    public async Task<CustomerInvoiceDto> CancelCustomerInvoiceAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var inv = await _context.CustomerInvoices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (inv == null) throw new KeyNotFoundException($"Customer Invoice {id} not found.");
        if (inv.Status == InvoiceStatus.Paid || inv.Status == InvoiceStatus.PartiallyPaid)
        {
            throw new InvalidOperationException("Cannot cancel invoice with existing payments.");
        }

        inv.Status = InvoiceStatus.Cancelled;
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CANCEL_CUSTOMER_INVOICE", "CustomerInvoice", inv.Id.ToString(), "", $"Cancelled customer invoice {inv.InvoiceNumber}");

        return MapToCustomerInvoiceDto(inv);
    }

    #endregion

    #region Supplier Invoices

    public async Task<PagedResult<SupplierInvoiceDto>> GetSupplierInvoicesAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.SupplierInvoices
            .Include(x => x.Supplier)
            .Include(x => x.PurchaseOrder)
            .Include(x => x.GoodsReceipt)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x => x.InvoiceNumber.ToLower().Contains(term) || x.Supplier.SupplierName.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToSupplierInvoiceDto).ToList();
        return new PagedResult<SupplierInvoiceDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<SupplierInvoiceDto> GetSupplierInvoiceByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var inv = await _context.SupplierInvoices
            .Include(x => x.Supplier)
            .Include(x => x.PurchaseOrder)
            .Include(x => x.GoodsReceipt)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (inv == null) throw new KeyNotFoundException($"Supplier Invoice {id} not found.");
        return MapToSupplierInvoiceDto(inv);
    }

    public async Task<SupplierInvoiceDto> CreateSupplierInvoiceAsync(CreateSupplierInvoiceDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id == dto.SupplierId, cancellationToken);
        if (supplier == null) throw new KeyNotFoundException($"Supplier {dto.SupplierId} not found.");

        var number = string.IsNullOrWhiteSpace(dto.InvoiceNumber)
            ? $"INV-SUPP-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"
            : dto.InvoiceNumber.Trim();

        if (await _context.SupplierInvoices.AnyAsync(x => x.InvoiceNumber == number, cancellationToken))
        {
            throw new InvalidOperationException($"Duplicate Invoice Number '{number}' already exists.");
        }

        if (dto.Items == null || !dto.Items.Any())
        {
            throw new InvalidOperationException("Supplier Invoice must contain at least one line item.");
        }

        foreach (var item in dto.Items)
        {
            if (item.Quantity <= 0) throw new InvalidOperationException("Line item quantity must be greater than 0.");
            if (item.UnitPrice < 0) throw new InvalidOperationException("Line item unit price cannot be negative.");
        }

        decimal subtotal = dto.Items.Sum(i => i.Quantity * i.UnitPrice);
        decimal taxAmount = Math.Round(subtotal * (dto.TaxRate / 100m), 2);
        decimal total = subtotal + taxAmount;

        var invoice = new SupplierInvoice
        {
            InvoiceNumber = number,
            PurchaseOrderId = dto.PurchaseOrderId,
            GoodsReceiptId = dto.GoodsReceiptId,
            SupplierId = dto.SupplierId,
            InvoiceDate = dto.InvoiceDate,
            DueDate = dto.DueDate,
            SubTotal = subtotal,
            TaxRate = dto.TaxRate,
            TaxAmount = taxAmount,
            TotalAmount = total,
            AmountPaid = 0,
            BalanceDue = total,
            Status = InvoiceStatus.Draft,
            Notes = dto.Notes
        };

        foreach (var i in dto.Items)
        {
            invoice.Items.Add(new SupplierInvoiceItem
            {
                ProductId = i.ProductId,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                LineTotal = i.Quantity * i.UnitPrice
            });
        }

        _context.SupplierInvoices.Add(invoice);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CREATE_SUPPLIER_INVOICE", "SupplierInvoice", invoice.Id.ToString(), "", $"Created supplier invoice {invoice.InvoiceNumber}");

        return MapToSupplierInvoiceDto(invoice);
    }

    public async Task<SupplierInvoiceDto> ApproveSupplierInvoiceAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var inv = await _context.SupplierInvoices
            .Include(x => x.Supplier)
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (inv == null) throw new KeyNotFoundException($"Supplier Invoice {id} not found.");
        if (inv.Status != InvoiceStatus.Draft)
        {
            throw new InvalidOperationException($"Cannot approve supplier invoice in status '{inv.Status}'.");
        }

        inv.Status = InvoiceStatus.Approved;
        await _context.SaveChangesAsync(cancellationToken);

        // Auto GL Entry: Debit Raw Materials Inventory (1200) / Operating Expense (6000), Credit AP (2000)
        await CreateAndPostJournalForSupplierInvoiceAsync(inv, userId, cancellationToken);

        await _auditLogger.LogAsync("APPROVE_SUPPLIER_INVOICE", "SupplierInvoice", inv.Id.ToString(), "", $"Approved supplier invoice {inv.InvoiceNumber}");

        return MapToSupplierInvoiceDto(inv);
    }

    public async Task<SupplierInvoiceDto> CancelSupplierInvoiceAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var inv = await _context.SupplierInvoices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (inv == null) throw new KeyNotFoundException($"Supplier Invoice {id} not found.");
        if (inv.Status == InvoiceStatus.Paid || inv.Status == InvoiceStatus.PartiallyPaid)
        {
            throw new InvalidOperationException("Cannot cancel invoice with existing payments.");
        }

        inv.Status = InvoiceStatus.Cancelled;
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CANCEL_SUPPLIER_INVOICE", "SupplierInvoice", inv.Id.ToString(), "", $"Cancelled supplier invoice {inv.InvoiceNumber}");

        return MapToSupplierInvoiceDto(inv);
    }

    #endregion

    #region Payments

    public async Task<PagedResult<PaymentDto>> GetPaymentsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Payments
            .Include(p => p.CustomerInvoice)
            .Include(p => p.SupplierInvoice)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p => p.PaymentNumber.ToLower().Contains(term) || (p.TransactionReference != null && p.TransactionReference.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(p => p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToPaymentDto).ToList();
        return new PagedResult<PaymentDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<PaymentDto> RecordPaymentAsync(RecordPaymentDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (dto.Amount <= 0)
        {
            throw new InvalidOperationException("Payment amount must be greater than 0.");
        }

        if (dto.Type == PaymentType.CustomerPayment)
        {
            if (!dto.CustomerInvoiceId.HasValue) throw new InvalidOperationException("CustomerInvoiceId is required for CustomerPayment.");
            var inv = await _context.CustomerInvoices.FirstOrDefaultAsync(x => x.Id == dto.CustomerInvoiceId.Value, cancellationToken);
            if (inv == null) throw new KeyNotFoundException($"Customer Invoice {dto.CustomerInvoiceId} not found.");
            if (inv.Status == InvoiceStatus.Cancelled) throw new InvalidOperationException("Cannot record payment against a cancelled invoice.");
            if (dto.Amount > inv.BalanceDue)
            {
                throw new InvalidOperationException($"Payment amount ({dto.Amount:C}) exceeds balance due ({inv.BalanceDue:C}).");
            }
        }
        else
        {
            if (!dto.SupplierInvoiceId.HasValue) throw new InvalidOperationException("SupplierInvoiceId is required for SupplierPayment.");
            var inv = await _context.SupplierInvoices.FirstOrDefaultAsync(x => x.Id == dto.SupplierInvoiceId.Value, cancellationToken);
            if (inv == null) throw new KeyNotFoundException($"Supplier Invoice {dto.SupplierInvoiceId} not found.");
            if (inv.Status == InvoiceStatus.Cancelled) throw new InvalidOperationException("Cannot record payment against a cancelled invoice.");
            if (dto.Amount > inv.BalanceDue)
            {
                throw new InvalidOperationException($"Payment amount ({dto.Amount:C}) exceeds balance due ({inv.BalanceDue:C}).");
            }
        }

        var payNum = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

        var payment = new Payment
        {
            PaymentNumber = payNum,
            Type = dto.Type,
            CustomerInvoiceId = dto.CustomerInvoiceId,
            SupplierInvoiceId = dto.SupplierInvoiceId,
            PaymentDate = dto.PaymentDate,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            TransactionReference = dto.TransactionReference,
            Notes = dto.Notes,
            Status = PaymentStatus.Recorded
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("RECORD_PAYMENT", "Payment", payment.Id.ToString(), "", $"Recorded payment {payment.PaymentNumber} for amount {payment.Amount}");

        return MapToPaymentDto(payment);
    }

    public async Task<PaymentDto> ApprovePaymentAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var pay = await _context.Payments
            .Include(p => p.CustomerInvoice)
            .Include(p => p.SupplierInvoice)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (pay == null) throw new KeyNotFoundException($"Payment {id} not found.");
        if (pay.Status != PaymentStatus.Recorded)
        {
            throw new InvalidOperationException($"Payment cannot be approved from status '{pay.Status}'.");
        }

        pay.Status = PaymentStatus.Approved;

        if (pay.Type == PaymentType.CustomerPayment && pay.CustomerInvoice != null)
        {
            var inv = pay.CustomerInvoice;
            inv.AmountPaid += pay.Amount;
            inv.BalanceDue = Math.Max(0, inv.TotalAmount - inv.AmountPaid);
            inv.Status = inv.BalanceDue == 0 ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;

            // Auto GL: Debit Cash (1010), Credit AR (1100)
            await CreateAndPostJournalForCustomerPaymentAsync(pay, userId, cancellationToken);
        }
        else if (pay.Type == PaymentType.SupplierPayment && pay.SupplierInvoice != null)
        {
            var inv = pay.SupplierInvoice;
            inv.AmountPaid += pay.Amount;
            inv.BalanceDue = Math.Max(0, inv.TotalAmount - inv.AmountPaid);
            inv.Status = inv.BalanceDue == 0 ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;

            // Auto GL: Debit AP (2000), Credit Cash (1010)
            await CreateAndPostJournalForSupplierPaymentAsync(pay, userId, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("APPROVE_PAYMENT", "Payment", pay.Id.ToString(), "", $"Approved payment {pay.PaymentNumber}");

        return MapToPaymentDto(pay);
    }

    #endregion

    #region AP / AR Summaries

    public async Task<AccountsPayableSummaryDto> GetAccountsPayableSummaryAsync(CancellationToken cancellationToken = default)
    {
        var invoices = await _context.SupplierInvoices
            .Include(x => x.Supplier)
            .Where(x => x.Status != InvoiceStatus.Cancelled)
            .OrderByDescending(x => x.DueDate)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var totalOutstanding = invoices.Sum(x => x.BalanceDue);
        var totalPaid = invoices.Sum(x => x.AmountPaid);
        var pendingCount = invoices.Count(x => x.BalanceDue > 0);
        var overdue = invoices.Where(x => x.BalanceDue > 0 && x.DueDate < now).Sum(x => x.BalanceDue);

        return new AccountsPayableSummaryDto
        {
            TotalOutstanding = totalOutstanding,
            TotalPaid = totalPaid,
            PendingInvoicesCount = pendingCount,
            OverdueAmount = overdue,
            Invoices = invoices.Select(MapToSupplierInvoiceDto).ToList()
        };
    }

    public async Task<AccountsReceivableSummaryDto> GetAccountsReceivableSummaryAsync(CancellationToken cancellationToken = default)
    {
        var invoices = await _context.CustomerInvoices
            .Include(x => x.Customer)
            .Where(x => x.Status != InvoiceStatus.Cancelled)
            .OrderByDescending(x => x.DueDate)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var totalOutstanding = invoices.Sum(x => x.BalanceDue);
        var totalCollected = invoices.Sum(x => x.AmountPaid);
        var pendingCount = invoices.Count(x => x.BalanceDue > 0);
        var overdue = invoices.Where(x => x.BalanceDue > 0 && x.DueDate < now).Sum(x => x.BalanceDue);

        return new AccountsReceivableSummaryDto
        {
            TotalOutstanding = totalOutstanding,
            TotalCollected = totalCollected,
            PendingInvoicesCount = pendingCount,
            OverdueAmount = overdue,
            Invoices = invoices.Select(MapToCustomerInvoiceDto).ToList()
        };
    }

    #endregion

    #region General Ledger / Journal Entries

    public async Task<PagedResult<JournalEntryDto>> GetJournalEntriesAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.JournalEntries
            .Include(j => j.Lines)
                .ThenInclude(l => l.Account)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(j => j.EntryNumber.ToLower().Contains(term) || j.Description.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(j => j.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items.Select(MapToJournalEntryDto).ToList();
        return new PagedResult<JournalEntryDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<JournalEntryDto> GetJournalEntryByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entry = await _context.JournalEntries
            .Include(j => j.Lines)
                .ThenInclude(l => l.Account)
            .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);

        if (entry == null) throw new KeyNotFoundException($"Journal Entry {id} not found.");
        return MapToJournalEntryDto(entry);
    }

    public async Task<JournalEntryDto> CreateJournalEntryAsync(CreateJournalEntryDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (dto.Lines == null || dto.Lines.Count < 2)
        {
            throw new InvalidOperationException("Journal Entry must contain at least 2 lines (debit & credit).");
        }

        decimal totalDebit = dto.Lines.Sum(l => l.Debit);
        decimal totalCredit = dto.Lines.Sum(l => l.Credit);

        if (totalDebit != totalCredit)
        {
            throw new InvalidOperationException($"Unbalanced Journal Entry! Total Debit ({totalDebit}) != Total Credit ({totalCredit}).");
        }

        var entryNumber = $"JNL-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

        var entry = new JournalEntry
        {
            EntryNumber = entryNumber,
            EntryDate = dto.EntryDate,
            Description = dto.Description,
            SourceDocumentType = dto.SourceDocumentType ?? "Manual",
            SourceDocumentId = dto.SourceDocumentId,
            Status = JournalStatus.Draft,
            TotalDebit = totalDebit,
            TotalCredit = totalCredit
        };

        var accountsDict = await _context.ChartOfAccounts.ToDictionaryAsync(a => a.Id, cancellationToken);

        foreach (var l in dto.Lines)
        {
            if (!accountsDict.TryGetValue(l.AccountId, out var acc))
            {
                throw new KeyNotFoundException($"Account {l.AccountId} not found in Chart of Accounts.");
            }

            entry.Lines.Add(new JournalEntryLine
            {
                AccountId = acc.Id,
                AccountCode = acc.AccountCode,
                AccountName = acc.AccountName,
                Description = l.Description,
                Debit = l.Debit,
                Credit = l.Credit
            });
        }

        _context.JournalEntries.Add(entry);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CREATE_JOURNAL", "JournalEntry", entry.Id.ToString(), "", $"Created journal entry {entry.EntryNumber}");

        return MapToJournalEntryDto(entry);
    }

    public async Task<JournalEntryDto> PostJournalEntryAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var entry = await _context.JournalEntries
            .Include(j => j.Lines)
            .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);

        if (entry == null) throw new KeyNotFoundException($"Journal Entry {id} not found.");
        if (entry.Status != JournalStatus.Draft)
        {
            throw new InvalidOperationException($"Journal entry cannot be posted from status '{entry.Status}'.");
        }

        if (entry.TotalDebit != entry.TotalCredit)
        {
            throw new InvalidOperationException($"Unbalanced Journal Entry cannot be posted!");
        }

        entry.Status = JournalStatus.Posted;
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("POST_JOURNAL", "JournalEntry", entry.Id.ToString(), "", $"Posted journal entry {entry.EntryNumber}");

        return MapToJournalEntryDto(entry);
    }

    #endregion

    #region Helper Automated Journal Generators

    private async Task CreateAndPostJournalForCustomerInvoiceAsync(CustomerInvoice inv, Guid userId, CancellationToken cancellationToken)
    {
        var arAcc = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "1100", cancellationToken);
        var revAcc = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "4000", cancellationToken);
        var taxAcc = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "2100", cancellationToken);

        if (arAcc == null || revAcc == null) return;

        var jnl = new JournalEntry
        {
            EntryNumber = $"JNL-AR-{inv.InvoiceNumber}",
            EntryDate = DateTime.UtcNow,
            Description = $"Auto GL Post for Customer Invoice {inv.InvoiceNumber}",
            SourceDocumentType = "CustomerInvoice",
            SourceDocumentId = inv.Id,
            Status = JournalStatus.Posted,
            TotalDebit = inv.TotalAmount,
            TotalCredit = inv.TotalAmount
        };

        jnl.Lines.Add(new JournalEntryLine { AccountId = arAcc.Id, AccountCode = arAcc.AccountCode, AccountName = arAcc.AccountName, Debit = inv.TotalAmount, Credit = 0 });
        jnl.Lines.Add(new JournalEntryLine { AccountId = revAcc.Id, AccountCode = revAcc.AccountCode, AccountName = revAcc.AccountName, Debit = 0, Credit = inv.SubTotal });

        if (inv.TaxAmount > 0 && taxAcc != null)
        {
            jnl.Lines.Add(new JournalEntryLine { AccountId = taxAcc.Id, AccountCode = taxAcc.AccountCode, AccountName = taxAcc.AccountName, Debit = 0, Credit = inv.TaxAmount });
        }

        _context.JournalEntries.Add(jnl);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task CreateAndPostJournalForSupplierInvoiceAsync(SupplierInvoice inv, Guid userId, CancellationToken cancellationToken)
    {
        var expAcc = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "1200", cancellationToken)
                  ?? await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "6000", cancellationToken);
        var apAcc = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "2000", cancellationToken);

        if (expAcc == null || apAcc == null) return;

        var jnl = new JournalEntry
        {
            EntryNumber = $"JNL-AP-{inv.InvoiceNumber}",
            EntryDate = DateTime.UtcNow,
            Description = $"Auto GL Post for Supplier Invoice {inv.InvoiceNumber}",
            SourceDocumentType = "SupplierInvoice",
            SourceDocumentId = inv.Id,
            Status = JournalStatus.Posted,
            TotalDebit = inv.TotalAmount,
            TotalCredit = inv.TotalAmount
        };

        jnl.Lines.Add(new JournalEntryLine { AccountId = expAcc.Id, AccountCode = expAcc.AccountCode, AccountName = expAcc.AccountName, Debit = inv.TotalAmount, Credit = 0 });
        jnl.Lines.Add(new JournalEntryLine { AccountId = apAcc.Id, AccountCode = apAcc.AccountCode, AccountName = apAcc.AccountName, Debit = 0, Credit = inv.TotalAmount });

        _context.JournalEntries.Add(jnl);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task CreateAndPostJournalForCustomerPaymentAsync(Payment pay, Guid userId, CancellationToken cancellationToken)
    {
        var cashAcc = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "1010", cancellationToken);
        var arAcc = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "1100", cancellationToken);

        if (cashAcc == null || arAcc == null) return;

        var jnl = new JournalEntry
        {
            EntryNumber = $"JNL-PAY-{pay.PaymentNumber}",
            EntryDate = DateTime.UtcNow,
            Description = $"Auto GL Post for Customer Payment {pay.PaymentNumber}",
            SourceDocumentType = "Payment",
            SourceDocumentId = pay.Id,
            Status = JournalStatus.Posted,
            TotalDebit = pay.Amount,
            TotalCredit = pay.Amount
        };

        jnl.Lines.Add(new JournalEntryLine { AccountId = cashAcc.Id, AccountCode = cashAcc.AccountCode, AccountName = cashAcc.AccountName, Debit = pay.Amount, Credit = 0 });
        jnl.Lines.Add(new JournalEntryLine { AccountId = arAcc.Id, AccountCode = arAcc.AccountCode, AccountName = arAcc.AccountName, Debit = 0, Credit = pay.Amount });

        _context.JournalEntries.Add(jnl);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task CreateAndPostJournalForSupplierPaymentAsync(Payment pay, Guid userId, CancellationToken cancellationToken)
    {
        var apAcc = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "2000", cancellationToken);
        var cashAcc = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.AccountCode == "1010", cancellationToken);

        if (apAcc == null || cashAcc == null) return;

        var jnl = new JournalEntry
        {
            EntryNumber = $"JNL-PAY-{pay.PaymentNumber}",
            EntryDate = DateTime.UtcNow,
            Description = $"Auto GL Post for Supplier Payment {pay.PaymentNumber}",
            SourceDocumentType = "Payment",
            SourceDocumentId = pay.Id,
            Status = JournalStatus.Posted,
            TotalDebit = pay.Amount,
            TotalCredit = pay.Amount
        };

        jnl.Lines.Add(new JournalEntryLine { AccountId = apAcc.Id, AccountCode = apAcc.AccountCode, AccountName = apAcc.AccountName, Debit = pay.Amount, Credit = 0 });
        jnl.Lines.Add(new JournalEntryLine { AccountId = cashAcc.Id, AccountCode = cashAcc.AccountCode, AccountName = cashAcc.AccountName, Debit = 0, Credit = pay.Amount });

        _context.JournalEntries.Add(jnl);
        await _context.SaveChangesAsync(cancellationToken);
    }

    #endregion

    #region Mappers

    private static CustomerInvoiceDto MapToCustomerInvoiceDto(CustomerInvoice inv)
    {
        return new CustomerInvoiceDto
        {
            Id = inv.Id,
            InvoiceNumber = inv.InvoiceNumber,
            SalesOrderId = inv.SalesOrderId,
            SalesOrderNumber = inv.SalesOrder?.OrderNumber,
            CustomerId = inv.CustomerId,
            CustomerName = inv.CustomerName,
            CustomerAddress = inv.CustomerAddress,
            InvoiceDate = inv.InvoiceDate,
            DueDate = inv.DueDate,
            SubTotal = inv.SubTotal,
            TaxRate = inv.TaxRate,
            TaxAmount = inv.TaxAmount,
            TotalAmount = inv.TotalAmount,
            AmountPaid = inv.AmountPaid,
            BalanceDue = inv.BalanceDue,
            Status = inv.Status,
            Notes = inv.Notes,
            Items = inv.Items.Select(i => new CustomerInvoiceItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                LineTotal = i.LineTotal
            }).ToList()
        };
    }

    private static SupplierInvoiceDto MapToSupplierInvoiceDto(SupplierInvoice inv)
    {
        return new SupplierInvoiceDto
        {
            Id = inv.Id,
            InvoiceNumber = inv.InvoiceNumber,
            PurchaseOrderId = inv.PurchaseOrderId,
            PurchaseOrderNumber = inv.PurchaseOrder?.PONumber,
            GoodsReceiptId = inv.GoodsReceiptId,
            GoodsReceiptNumber = inv.GoodsReceipt?.GRNNumber,
            SupplierId = inv.SupplierId,
            SupplierName = inv.Supplier?.SupplierName ?? "Supplier",
            InvoiceDate = inv.InvoiceDate,
            DueDate = inv.DueDate,
            SubTotal = inv.SubTotal,
            TaxRate = inv.TaxRate,
            TaxAmount = inv.TaxAmount,
            TotalAmount = inv.TotalAmount,
            AmountPaid = inv.AmountPaid,
            BalanceDue = inv.BalanceDue,
            Status = inv.Status,
            Notes = inv.Notes,
            Items = inv.Items.Select(i => new SupplierInvoiceItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                LineTotal = i.LineTotal
            }).ToList()
        };
    }

    private static PaymentDto MapToPaymentDto(Payment pay)
    {
        return new PaymentDto
        {
            Id = pay.Id,
            PaymentNumber = pay.PaymentNumber,
            Type = pay.Type,
            CustomerInvoiceId = pay.CustomerInvoiceId,
            CustomerInvoiceNumber = pay.CustomerInvoice?.InvoiceNumber,
            SupplierInvoiceId = pay.SupplierInvoiceId,
            SupplierInvoiceNumber = pay.SupplierInvoice?.InvoiceNumber,
            PaymentDate = pay.PaymentDate,
            Amount = pay.Amount,
            PaymentMethod = pay.PaymentMethod,
            TransactionReference = pay.TransactionReference,
            Notes = pay.Notes,
            Status = pay.Status
        };
    }

    private static JournalEntryDto MapToJournalEntryDto(JournalEntry entry)
    {
        return new JournalEntryDto
        {
            Id = entry.Id,
            EntryNumber = entry.EntryNumber,
            EntryDate = entry.EntryDate,
            Description = entry.Description,
            SourceDocumentType = entry.SourceDocumentType,
            SourceDocumentId = entry.SourceDocumentId,
            Status = entry.Status,
            TotalDebit = entry.TotalDebit,
            TotalCredit = entry.TotalCredit,
            Lines = entry.Lines.Select(l => new JournalEntryLineDto
            {
                Id = l.Id,
                AccountId = l.AccountId,
                AccountCode = l.AccountCode,
                AccountName = l.AccountName,
                Description = l.Description,
                Debit = l.Debit,
                Credit = l.Credit
            }).ToList()
        };
    }

    #endregion
}
