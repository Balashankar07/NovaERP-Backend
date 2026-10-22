using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;
using System.Linq.Expressions;

namespace NovaERP.Infrastructure.Repositories;

public class WarehouseRepository : Repository<Warehouse>, IWarehouseRepository
{
    public WarehouseRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> ExistsByCodeAsync(string warehouseCode)
    {
        return await _dbSet.AnyAsync(x => x.WarehouseCode == warehouseCode);
    }

    public async Task<Warehouse?> GetByCodeAsync(string warehouseCode)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.WarehouseCode == warehouseCode);
    }

    public async Task<bool> HasDefaultWarehouseAsync(Guid? excludeWarehouseId = null)
    {
        return await _dbSet.AnyAsync(x => x.IsDefault && x.Id != excludeWarehouseId);
    }

    public async Task<Warehouse?> GetDefaultWarehouseAsync()
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.IsDefault);
    }

    public override async Task<PagedResult<Warehouse>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var query = _dbSet.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.WarehouseCode.Contains(search) || 
                                     x.WarehouseName.Contains(search) || 
                                     (x.City != null && x.City.Contains(search)) ||
                                     (x.ManagerName != null && x.ManagerName.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            bool isDesc = sortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) ?? false;
            
            Expression<Func<Warehouse, object>> keySelector = sortBy.ToLower() switch
            {
                "code" => x => x.WarehouseCode,
                "name" => x => x.WarehouseName,
                "city" => x => x.City ?? string.Empty,
                "createdat" => x => x.CreatedAt,
                "isactive" => x => x.IsActive,
                "isdefault" => x => x.IsDefault,
                _ => x => x.CreatedAt
            };

            query = isDesc ? query.OrderByDescending(keySelector) : query.OrderBy(keySelector);
        }
        else
        {
            query = query.OrderBy(x => x.WarehouseCode);
        }

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<Warehouse>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}
