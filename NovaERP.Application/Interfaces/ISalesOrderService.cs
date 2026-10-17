using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.Sales;

namespace NovaERP.Application.Interfaces;

public interface ISalesOrderService
{
    Task<PagedResult<SalesOrderDto>> GetSalesOrdersAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder);
    Task<SalesOrderDto> GetSalesOrderByIdAsync(Guid id);
    Task<SalesOrderDto> CreateAsync(CreateSalesOrderDto dto, Guid? currentUserId);
    Task<SalesOrderDto> UpdateAsync(Guid id, UpdateSalesOrderDto dto, Guid? currentUserId);
    Task DeleteAsync(Guid id, Guid? currentUserId);
    Task<SalesOrderDto> SubmitAsync(Guid id, Guid? currentUserId);
    Task<SalesOrderDto> ApproveAsync(Guid id, Guid? currentUserId);
    Task<SalesOrderDto> RejectAsync(Guid id, Guid? currentUserId);
    Task<SalesOrderDto> ReserveAsync(Guid id, Guid? currentUserId);
    Task<SalesOrderDto> CancelAsync(Guid id, string reason, Guid? currentUserId);
}
