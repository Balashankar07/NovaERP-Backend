using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Suppliers.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface ISupplierProductService
{
    Task<SupplierProductDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<SupplierProductDto>> GetBySupplierIdAsync(Guid supplierId);
    Task<IEnumerable<SupplierProductDto>> GetByProductIdAsync(Guid productId);
    Task<PagedResult<SupplierProductDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);
    Task<SupplierProductDto> CreateAsync(CreateSupplierProductDto dto);
    Task<SupplierProductDto?> UpdateAsync(Guid id, UpdateSupplierProductDto dto);
    Task<bool> DeleteAsync(Guid id);
}
