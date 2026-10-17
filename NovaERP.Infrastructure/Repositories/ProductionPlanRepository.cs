using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class ProductionPlanRepository : Repository<ProductionPlan>, IProductionPlanRepository
{
    public ProductionPlanRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<string> GeneratePlanNumberAsync()
    {
        var currentYearMonth = DateTime.UtcNow.ToString("yyyyMM");
        
        var lastPlan = await _dbSet
            .Where(x => x.PlanNumber.StartsWith($"MRP-{currentYearMonth}-"))
            .OrderByDescending(x => x.PlanNumber)
            .FirstOrDefaultAsync();

        if (lastPlan == null)
            return $"MRP-{currentYearMonth}-0001";

        var lastSequenceStr = lastPlan.PlanNumber.Split('-').Last();
        if (int.TryParse(lastSequenceStr, out int lastSequence))
        {
            return $"MRP-{currentYearMonth}-{(lastSequence + 1):D4}";
        }

        return $"MRP-{currentYearMonth}-0001";
    }

    public async Task<PagedResult<ProductionPlan>> GetAllPagedAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var query = _dbSet
            .Include(x => x.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => 
                x.PlanNumber.Contains(search) || 
                (x.Product != null && x.Product.Name.Contains(search)) ||
                (x.Product != null && x.Product.ProductCode.Contains(search)));
        }

        bool isDesc = sortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) ?? false;

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            query = sortBy.ToLower() switch
            {
                "plannumber" => isDesc ? query.OrderByDescending(x => x.PlanNumber) : query.OrderBy(x => x.PlanNumber),
                "plannedstartdate" => isDesc ? query.OrderByDescending(x => x.PlannedStartDate) : query.OrderBy(x => x.PlannedStartDate),
                "plannedenddate" => isDesc ? query.OrderByDescending(x => x.PlannedEndDate) : query.OrderBy(x => x.PlannedEndDate),
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

        return new PagedResult<ProductionPlan>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ProductionPlan?> GetWithRequirementsAsync(Guid id)
    {
        return await _dbSet
            .Include(x => x.Product)
            .Include(x => x.Requirements)
                .ThenInclude(r => r.Product)
            .Include(x => x.Requirements)
                .ThenInclude(r => r.Unit)
            .FirstOrDefaultAsync(x => x.Id == id);
    }
}
