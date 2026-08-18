using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.ProductionPlans.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface IProductionPlanService
{
    Task<PagedResult<ProductionPlanDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);
    Task<ProductionPlanDto?> GetByIdAsync(Guid id);
    Task<ProductionPlanDto> CreateAsync(CreateProductionPlanDto dto, Guid? currentUserId);
    Task<ProductionPlanDto> UpdateAsync(Guid id, UpdateProductionPlanDto dto, Guid? currentUserId);
    Task<bool> DeleteAsync(Guid id, Guid? currentUserId);
    Task<ProductionPlanDto> ReleaseAsync(Guid id, Guid? currentUserId);
    Task<NovaERP.Application.DTOs.Procurement.PurchaseRequestDto> GeneratePurchaseRequestAsync(Guid id, Guid? currentUserId);
    Task<List<ProductionRequirementDto>> GetRequirementsAsync(Guid id);
}
