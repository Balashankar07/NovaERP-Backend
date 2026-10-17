using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.PurchaseOrders.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface IPurchaseOrderService
{
    Task<PagedResult<PurchaseOrderDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);
    Task<PurchaseOrderDto?> GetByIdAsync(Guid id);
    Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderDto dto);
    Task<PurchaseOrderDto?> UpdateAsync(Guid id, UpdatePurchaseOrderDto dto);
    Task<bool> DeleteAsync(Guid id);
    
    // Status Transitions
    Task<PurchaseOrderDto?> SubmitAsync(Guid id);
    Task<PurchaseOrderDto?> ApproveAsync(Guid id);
    Task<PurchaseOrderDto?> RejectAsync(Guid id);
    Task<PurchaseOrderDto?> SendAsync(Guid id);
}
