using NovaERP.Domain.Entities;
using System.Linq.Expressions;

namespace NovaERP.Application.Interfaces.Repositories;

public interface ISupplierProductRepository : IRepository<SupplierProduct>
{
    Task<SupplierProduct?> GetBySupplierAndProductAsync(Guid supplierId, Guid productId);
    Task<IEnumerable<SupplierProduct>> GetByProductIdAsync(Guid productId);
    Task<IEnumerable<SupplierProduct>> GetBySupplierIdAsync(Guid supplierId);
    Task<IEnumerable<SupplierProduct>> FindAsync(Expression<Func<SupplierProduct, bool>> predicate);
}
