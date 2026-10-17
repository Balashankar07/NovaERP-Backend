using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface ISupplierRepository : IRepository<Supplier>
{
    Task<NovaERP.Application.Common.Models.PagedResult<Supplier>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null, bool? isActive = null);
    Task<Supplier?> GetByCodeAsync(string code);
    Task<bool> IsSupplierReferencedAsync(Guid supplierId);
}
