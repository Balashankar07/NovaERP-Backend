using NovaERP.Application.Common.Models;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IProductRepository
{
    Task<PagedResult<Product>> GetAllAsync(
        int pageNumber = 1,
        int pageSize = 20,
        string? search = null,
        string? sortBy = null,
        string? sortOrder = null,
        ProductType? productType = null);

    Task<Product?> GetByIdAsync(Guid id);

    Task<Product?> GetByCodeAsync(string code);

    Task<Product?> GetByProductNumberAsync(string productNumber);

    Task AddAsync(Product product);

    Task UpdateAsync(Product product);

    Task DeleteAsync(Product product);
}
