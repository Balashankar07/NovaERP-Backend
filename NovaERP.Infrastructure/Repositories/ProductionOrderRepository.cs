using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;


namespace NovaERP.Infrastructure.Repositories;

public class ProductionOrderRepository : Repository<ProductionOrder>, IProductionOrderRepository
{
    public ProductionOrderRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<ProductionOrder?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(x => x.ProductionOrderNumber == orderNumber, cancellationToken);
    }

    public async Task<IEnumerable<ProductionOrder>> GetByProductionPlanIdAsync(Guid planId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.ProductionPlanId == planId)
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<ProductionOrder>> GetAllPagedAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var query = _dbSet.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => 
                x.ProductionOrderNumber.Contains(search) || 
                (x.WorkCenter != null && x.WorkCenter.Contains(search)));
        }

        bool isDesc = sortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) ?? false;

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            query = sortBy.ToLower() switch
            {
                "productionordernumber" => isDesc ? query.OrderByDescending(x => x.ProductionOrderNumber) : query.OrderBy(x => x.ProductionOrderNumber),
                "plannedquantity" => isDesc ? query.OrderByDescending(x => x.PlannedQuantity) : query.OrderBy(x => x.PlannedQuantity),
                "createdat" => isDesc ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
                _ => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id)
            };
        }
        else
        {
            query = query.OrderByDescending(x => x.Id);
        }

        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : pageSize;

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<ProductionOrder>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ProductionOrder?> GetWithRequirementsAsync(Guid id)
    {
        return await _dbSet
            .Include(x => x.Requirements)
            .FirstOrDefaultAsync(x => x.Id == id);
    }
}
