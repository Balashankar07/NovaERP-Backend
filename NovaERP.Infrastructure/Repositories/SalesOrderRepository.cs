using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class SalesOrderRepository : Repository<SalesOrder>, ISalesOrderRepository
{
    public SalesOrderRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<SalesOrder>> GetSalesOrdersPagedAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder, Guid? currentUserId = null, bool isDistributor = false)
    {
        var query = _context.SalesOrders
            .Include(so => so.Distributor)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(so => 
                so.OrderNumber.Contains(search) || 
                (so.Distributor != null && so.Distributor.CompanyName.Contains(search)));
        }

        if (isDistributor && currentUserId.HasValue)
        {
            query = query.Where(so => so.CreatedBy == currentUserId.Value);
        }

        query = sortBy?.ToLower() switch
        {
            "ordernumber" => sortOrder?.ToLower() == "desc" ? query.OrderByDescending(x => x.OrderNumber) : query.OrderBy(x => x.OrderNumber),
            "orderdate" => sortOrder?.ToLower() == "desc" ? query.OrderByDescending(x => x.OrderDate) : query.OrderBy(x => x.OrderDate),
            "status" => sortOrder?.ToLower() == "desc" ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
            "totalamount" => sortOrder?.ToLower() == "desc" ? query.OrderByDescending(x => x.TotalAmount) : query.OrderBy(x => x.TotalAmount),
            _ => query.OrderByDescending(x => x.OrderDate)
        };

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<SalesOrder> { Items = items, TotalCount = totalCount, PageNumber = pageNumber, PageSize = pageSize };
    }

    public async Task<SalesOrder?> GetSalesOrderWithDetailsAsync(Guid id, Guid? currentUserId = null, bool isDistributor = false)
    {
        var query = _context.SalesOrders
            .Include(so => so.Distributor)
            .Include(so => so.SalesOrderItems)
            .ThenInclude(soi => soi.Product)
            .AsQueryable();

        if (isDistributor && currentUserId.HasValue)
        {
            query = query.Where(so => so.CreatedBy == currentUserId.Value);
        }

        return await query.FirstOrDefaultAsync(so => so.Id == id);
    }

    public async Task<string> GenerateOrderNumberAsync()
    {
        var today = DateTime.UtcNow;
        var prefix = $"SO-{today:yyyyMMdd}-";
        
        var lastOrder = await _context.SalesOrders
            .Where(so => so.OrderNumber.StartsWith(prefix))
            .OrderByDescending(so => so.OrderNumber)
            .FirstOrDefaultAsync();

        if (lastOrder == null)
            return $"{prefix}0001";

        var lastSequence = int.Parse(lastOrder.OrderNumber.Substring(prefix.Length));
        return $"{prefix}{(lastSequence + 1):D4}";
    }
}
