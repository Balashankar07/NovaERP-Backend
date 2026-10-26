using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Warranties.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface IWarrantyService
{
    // Warranties
    Task<WarrantyDto> GetWarrantyByIdAsync(Guid id);
    Task<PagedResult<WarrantyDto>> GetAllWarrantiesAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder);
    Task<List<EligibleShipmentDto>> GetEligibleShipmentsAsync();
    Task<string> GetNextSerialNumberAsync(Guid productId);
    Task<WarrantyDto> CreateWarrantyAsync(CreateWarrantyDto request);
    Task<WarrantyDto> UpdateWarrantyAsync(Guid id, UpdateWarrantyDto request);
    Task DeleteWarrantyAsync(Guid id);

    // Warranty Claims
    Task<WarrantyClaimDto> GetClaimByIdAsync(Guid claimId);
    Task<PagedResult<WarrantyClaimDto>> GetAllClaimsAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder);
    Task<WarrantyClaimDto> CreateClaimAsync(CreateWarrantyClaimDto request);
    Task<WarrantyClaimDto> UpdateClaimAsync(Guid claimId, UpdateWarrantyClaimDto request);
}
