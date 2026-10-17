using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class SupplierRepository : Repository<Supplier>, ISupplierRepository
{
    public SupplierRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Supplier?> GetByCodeAsync(string code)
    {
        return await _context.Suppliers
            .FirstOrDefaultAsync(s => s.SupplierCode == code && s.IsActive);
    }

    public async Task<bool> IsSupplierReferencedAsync(Guid supplierId)
    {
        bool hasPOs = await _context.PurchaseOrders.AnyAsync(po => po.SupplierId == supplierId);
        bool hasSupplierProducts = await _context.SupplierProducts.AnyAsync(sp => sp.SupplierId == supplierId);
        
        return hasPOs || hasSupplierProducts;
    }

    public override async Task<NovaERP.Application.Common.Models.PagedResult<Supplier>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        return await GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder, null);
    }

    public async Task<NovaERP.Application.Common.Models.PagedResult<Supplier>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null, bool? isActive = null)
    {
        var query = _context.Suppliers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.SupplierName.Contains(search) || x.SupplierCode.Contains(search) || (x.CompanyName != null && x.CompanyName.Contains(search)));
        }

        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            bool isDesc = sortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) ?? false;
            query = sortBy.ToLower() switch
            {
                "name" => isDesc ? query.OrderByDescending(x => x.SupplierName) : query.OrderBy(x => x.SupplierName),
                "suppliername" => isDesc ? query.OrderByDescending(x => x.SupplierName) : query.OrderBy(x => x.SupplierName),
                "code" => isDesc ? query.OrderByDescending(x => x.SupplierCode) : query.OrderBy(x => x.SupplierCode),
                "suppliercode" => isDesc ? query.OrderByDescending(x => x.SupplierCode) : query.OrderBy(x => x.SupplierCode),
                "company" => isDesc ? query.OrderByDescending(x => x.CompanyName) : query.OrderBy(x => x.CompanyName),
                "createdat" => isDesc ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
                _ => isDesc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id)
            };
        }

        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : pageSize;

        var totalCount = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.CountAsync(query);
        var items = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(query.Skip((pageNumber - 1) * pageSize).Take(pageSize));

        return new NovaERP.Application.Common.Models.PagedResult<Supplier>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}
