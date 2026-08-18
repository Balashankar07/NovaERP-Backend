using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IProductionOrderRequirementRepository : IRepository<ProductionOrderRequirement>
{
    Task<IEnumerable<ProductionOrderRequirement>> GetByProductionOrderIdAsync(Guid productionOrderId);
}
