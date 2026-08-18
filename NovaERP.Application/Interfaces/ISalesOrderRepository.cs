using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces;

public interface ISalesOrderRepository : IRepository<SalesOrder>
{
    Task<PagedResult<SalesOrder>> GetSalesOrdersPagedAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder, Guid? currentUserId = null, bool isDistributor = false);
    Task<SalesOrder?> GetSalesOrderWithDetailsAsync(Guid id, Guid? currentUserId = null, bool isDistributor = false);
    Task<string> GenerateOrderNumberAsync();
}
