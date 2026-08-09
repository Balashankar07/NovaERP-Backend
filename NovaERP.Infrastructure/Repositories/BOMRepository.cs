using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class BOMRepository : IBOMRepository
{
    private readonly AppDbContext _context;

    public BOMRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<NovaERP.Application.Common.Models.PagedResult<BOM>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var query = _context.BOMs
            .Include(x => x.Product)
            .Include(x => x.BOMItems)
                .ThenInclude(i => i.RawMaterialProduct)
            .Include(x => x.BOMItems)
                .ThenInclude(i => i.Unit)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Version.Contains(search) || (x.Description != null && x.Description.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            bool isDesc = sortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) ?? false;
            query = sortBy.ToLower() switch
            {
                "version" => isDesc ? query.OrderByDescending(x => x.Version).ThenBy(x => x.Id) : query.OrderBy(x => x.Version).ThenBy(x => x.Id),
                "createdat" => isDesc ? query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id) : query.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id),
                _ => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id)
            };
        }

        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : pageSize;

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new NovaERP.Application.Common.Models.PagedResult<BOM>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<BOM?> GetByIdAsync(Guid id)
    {
        return await _context.BOMs
            .Include(x => x.Product)
            .Include(x => x.BOMItems)
                .ThenInclude(i => i.RawMaterialProduct)
            .Include(x => x.BOMItems)
                .ThenInclude(i => i.Unit)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public Task AddAsync(BOM bom)
    {
        _context.BOMs.AddAsync(bom);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(BOM bom)
    {
        _context.BOMs.Update(bom);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(BOM bom)
    {
        _context.BOMs.Remove(bom);
        return Task.CompletedTask;
    }

    public async Task<BOM?> GetActiveByProductIdAsync(Guid productId)
    {
        return await _context.BOMs
            .Include(x => x.Product)
            .Include(x => x.BOMItems)
                .ThenInclude(i => i.RawMaterialProduct)
            .Include(x => x.BOMItems)
                .ThenInclude(i => i.Unit)
            .FirstOrDefaultAsync(x => x.ProductId == productId && x.IsActive);
    }
}
