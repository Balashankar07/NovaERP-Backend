using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class ProductionOrderRequirementRepository : Repository<ProductionOrderRequirement>, IProductionOrderRequirementRepository
{
    public ProductionOrderRequirementRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ProductionOrderRequirement>> GetByProductionOrderIdAsync(Guid productionOrderId)
    {
        return await _dbSet
            .Include(r => r.Product)
            .Where(r => r.ProductionOrderId == productionOrderId)
            .ToListAsync();
    }
}
