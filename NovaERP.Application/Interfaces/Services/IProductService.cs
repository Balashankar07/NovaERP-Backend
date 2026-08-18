using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Products.DTOs;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Interfaces.Services;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetAllAsync(
        int pageNumber = 1,
        int pageSize = 20,
        string? search = null,
        string? sortBy = null,
        string? sortOrder = null,
        ProductType? productType = null);

    Task<ProductDto?> GetByIdAsync(Guid id);

    Task<ProductDto> CreateAsync(CreateProductDto dto);

    Task<ProductDto?> UpdateAsync(Guid id, UpdateProductDto dto);

    Task<bool> DeleteAsync(Guid id);
}
