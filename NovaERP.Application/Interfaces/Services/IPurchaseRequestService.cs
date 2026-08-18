using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.Procurement;

namespace NovaERP.Application.Interfaces.Services;

public interface IPurchaseRequestService
{
    Task<PurchaseRequestDto> GetByIdAsync(Guid id);
    Task<PagedResult<PurchaseRequestDto>> GetAllAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder, string? status, string? priority, string? source);
    
    Task<PurchaseRequestDto> CreateAsync(CreatePurchaseRequestDto dto);
    Task<PurchaseRequestDto> UpdateAsync(Guid id, UpdatePurchaseRequestDto dto);
    Task DeleteAsync(Guid id);
    
    Task<PurchaseRequestDto> SubmitAsync(Guid id);
    Task<PurchaseRequestDto> ApproveAsync(Guid id);
    Task<PurchaseRequestDto> RejectAsync(Guid id, RejectPurchaseRequestDto dto);
    Task<PurchaseRequestDto> CancelAsync(Guid id);
}
