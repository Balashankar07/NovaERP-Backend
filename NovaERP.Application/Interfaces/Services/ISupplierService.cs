using NovaERP.Application.Features.Suppliers.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface ISupplierService
{
    Task<NovaERP.Application.Common.Models.PagedResult<SupplierDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null, bool? isActive = null);

    Task<SupplierDto?> GetByIdAsync(Guid id);

    Task<SupplierDto> CreateAsync(CreateSupplierDto dto);

    Task<SupplierDto?> UpdateAsync(Guid id, UpdateSupplierDto dto);

    Task<bool> DeleteAsync(Guid id);
    
    Task ActivateAsync(Guid id);
    Task DeactivateAsync(Guid id);
}
