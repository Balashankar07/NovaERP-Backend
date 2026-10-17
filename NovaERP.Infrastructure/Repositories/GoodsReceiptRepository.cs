using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class GoodsReceiptRepository : Repository<GoodsReceipt>, IGoodsReceiptRepository
{
    public GoodsReceiptRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<GoodsReceipt?> GetGoodsReceiptWithItemsAsync(Guid id)
    {
        return await _dbSet
            .Include(x => x.Supplier)
            .Include(x => x.PurchaseOrder)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<List<GoodsReceipt>> GetByPurchaseOrderIdAsync(Guid purchaseOrderId)
    {
        return await _dbSet
            .Include(x => x.Items)
            .Where(x => x.PurchaseOrderId == purchaseOrderId)
            .ToListAsync();
    }

    public async Task<string> GenerateGRNNumberAsync()
    {
        var prefix = $"GRN-{DateTime.UtcNow:yyyyMM}-";
        var lastGRN = await _dbSet
            .Where(x => x.GRNNumber.StartsWith(prefix))
            .OrderByDescending(x => x.GRNNumber)
            .FirstOrDefaultAsync();

        if (lastGRN == null)
            return $"{prefix}0001";

        var lastNumberStr = lastGRN.GRNNumber.Substring(prefix.Length);
        if (int.TryParse(lastNumberStr, out int lastNumber))
        {
            return $"{prefix}{(lastNumber + 1):D4}";
        }

        return $"{prefix}0001";
    }

    public override async Task<PagedResult<GoodsReceipt>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var query = _dbSet
            .Include(x => x.Supplier)
            .Include(x => x.PurchaseOrder)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.GRNNumber.Contains(search) || 
                                     (x.Remarks != null && x.Remarks.Contains(search)) ||
                                     (x.Supplier != null && x.Supplier.SupplierName.Contains(search)) ||
                                     (x.PurchaseOrder != null && x.PurchaseOrder.PONumber.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            bool isDesc = sortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) ?? false;
            query = sortBy.ToLower() switch
            {
                "grnnumber" => isDesc ? query.OrderByDescending(x => x.GRNNumber) : query.OrderBy(x => x.GRNNumber),
                "receiptdate" => isDesc ? query.OrderByDescending(x => x.ReceiptDate) : query.OrderBy(x => x.ReceiptDate),
                "status" => isDesc ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
                _ => isDesc ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt)
            };
        }
        else
        {
            query = query.OrderByDescending(x => x.CreatedAt);
        }

        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : pageSize;

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<GoodsReceipt>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}
