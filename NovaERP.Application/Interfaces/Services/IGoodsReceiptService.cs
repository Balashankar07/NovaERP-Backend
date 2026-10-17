using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.GoodsReceipts.DTOs;

namespace NovaERP.Application.Interfaces.Services;

public interface IGoodsReceiptService
{
    Task<PagedResult<GoodsReceiptDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);
    Task<GoodsReceiptDto?> GetByIdAsync(Guid id);
    Task<GoodsReceiptDto> CreateAsync(Guid currentUserId, CreateGoodsReceiptDto dto);
    Task<GoodsReceiptDto?> UpdateAsync(Guid id, UpdateGoodsReceiptDto dto);
    Task<bool> DeleteAsync(Guid id);
    
    // Status Transitions
    Task<GoodsReceiptDto?> ReceiveAsync(Guid id);
    Task<GoodsReceiptDto?> CancelAsync(Guid id);
}
