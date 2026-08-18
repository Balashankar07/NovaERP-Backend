using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class InventoryTransactionRepository : Repository<InventoryTransaction>, IInventoryTransactionRepository
{
    public InventoryTransactionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<InventoryTransaction>> GetByInventoryIdAsync(Guid inventoryId, int pageNumber = 1, int pageSize = 10)
    {
        var query = _dbSet
            .Where(x => x.InventoryId == inventoryId)
            .OrderByDescending(x => x.CreatedAt)
            .AsQueryable();

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<InventoryTransaction>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<InventoryTransaction>> GetAllTransactionsAsync(int pageNumber = 1, int pageSize = 20, string? search = null, string? transactionType = null, Guid? warehouseId = null, Guid? productId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _dbSet
            .Include(t => t.Inventory)
                .ThenInclude(i => i.Product)
            .Include(t => t.Inventory)
                .ThenInclude(i => i.Warehouse)
            .Include(t => t.Inventory)
                .ThenInclude(i => i.WarehouseLocation)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(t => t.Inventory != null && t.Inventory.Product != null && 
                (t.Inventory.Product.Name.Contains(search) || t.Inventory.Product.ProductCode.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(transactionType))
        {
            if (Enum.TryParse<NovaERP.Domain.Enums.InventoryTransactionType>(transactionType, out var type))
            {
                query = query.Where(t => t.TransactionType == type);
            }
        }

        if (warehouseId.HasValue)
        {
            query = query.Where(t => t.Inventory.WarehouseId == warehouseId.Value);
        }

        if (productId.HasValue)
        {
            query = query.Where(t => t.Inventory.ProductId == productId.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(t => t.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(t => t.CreatedAt <= endDate.Value);
        }

        query = query.OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<InventoryTransaction>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task AddTransactionAsync(InventoryTransaction transaction)
    {
        await _dbSet.AddAsync(transaction);
    }
}
