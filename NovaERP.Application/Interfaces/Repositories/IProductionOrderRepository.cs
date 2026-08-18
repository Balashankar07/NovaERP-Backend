using NovaERP.Domain.Entities;
using NovaERP.Application.Common.Models;


namespace NovaERP.Application.Interfaces.Repositories;

public interface IProductionOrderRepository : IRepository<ProductionOrder>
{
    Task<ProductionOrder?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<ProductionOrder>> GetByProductionPlanIdAsync(Guid planId, CancellationToken cancellationToken = default);
    Task<PagedResult<ProductionOrder>> GetAllPagedAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);
    Task<ProductionOrder?> GetWithRequirementsAsync(Guid id);
}
