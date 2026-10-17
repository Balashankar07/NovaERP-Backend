using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class ProductionExecutionRepository : Repository<ProductionExecution>, IProductionExecutionRepository
{
    public ProductionExecutionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<ProductionExecution>> GetAllPagedAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var query = _dbSet
            .Include(x => x.ProductionOrder)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.ExecutionNumber.Contains(search) || (x.Remarks != null && x.Remarks.Contains(search)));
        }

        bool isDesc = sortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) ?? false;
        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            query = sortBy.ToLower() switch
            {
                "executionnumber" => isDesc ? query.OrderByDescending(x => x.ExecutionNumber) : query.OrderBy(x => x.ExecutionNumber),
                "startedat" => isDesc ? query.OrderByDescending(x => x.StartedAt) : query.OrderBy(x => x.StartedAt),
                "status" => isDesc ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
                _ => isDesc ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt)
            };
        }
        else
        {
            query = query.OrderByDescending(x => x.CreatedAt);
        }

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<ProductionExecution>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public override async Task<ProductionExecution?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(x => x.ProductionOrder)
                .ThenInclude(po => po!.Product)
            .Include(x => x.MaterialConsumptions)
            .FirstOrDefaultAsync(x => x.Id == id);
    }
}
