using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class SupplierProductRepository : Repository<SupplierProduct>, ISupplierProductRepository
{
    public SupplierProductRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<SupplierProduct?> GetBySupplierAndProductAsync(Guid supplierId, Guid productId)
    {
        return await _dbSet
            .Include(sp => sp.Supplier)
            .Include(sp => sp.Product)
            .FirstOrDefaultAsync(sp => sp.SupplierId == supplierId && sp.ProductId == productId);
    }

    public async Task<IEnumerable<SupplierProduct>> GetByProductIdAsync(Guid productId)
    {
        return await _dbSet
            .Include(sp => sp.Supplier)
            .Include(sp => sp.Product)
            .Where(sp => sp.ProductId == productId && sp.IsActive)
            .ToListAsync();
    }

    public async Task<IEnumerable<SupplierProduct>> GetBySupplierIdAsync(Guid supplierId)
    {
        return await _dbSet
            .Include(sp => sp.Supplier)
            .Include(sp => sp.Product)
            .Where(sp => sp.SupplierId == supplierId && sp.IsActive)
            .ToListAsync();
    }
    
    public async Task<IEnumerable<SupplierProduct>> FindAsync(Expression<Func<SupplierProduct, bool>> predicate)
    {
        return await _dbSet
            .Include(sp => sp.Supplier)
            .Include(sp => sp.Product)
            .Where(predicate)
            .ToListAsync();
    }
}
