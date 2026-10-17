using NovaERP.Application.Features.BOMs.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface IBOMService
{
    Task<NovaERP.Application.Common.Models.PagedResult<BOMDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);

    Task<BOMDto?> GetByIdAsync(Guid id);

    Task<BOMDto> CreateAsync(CreateBOMDto dto);

    Task<BOMDto?> UpdateAsync(Guid id, UpdateBOMDto dto);

    Task<bool> DeleteAsync(Guid id);

    Task<bool> ActivateAsync(Guid id);

    Task<bool> DeactivateAsync(Guid id);
}
