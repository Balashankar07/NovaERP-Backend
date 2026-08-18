using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class InventoryReservationRepository : Repository<InventoryReservation>, IInventoryReservationRepository
{
    public InventoryReservationRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<InventoryReservation>> GetByProductionOrderIdAsync(Guid productionOrderId)
    {
        return await _dbSet
            .Include(r => r.Product)
            .Include(r => r.Warehouse)
            .Include(r => r.WarehouseLocation)
            .Where(r => r.ProductionOrderId == productionOrderId)
            .ToListAsync();
    }

    public async Task<IEnumerable<InventoryReservation>> GetActiveByProductionOrderIdAsync(Guid productionOrderId)
    {
        return await _dbSet
            .Include(r => r.Product)
            .Where(r => r.ProductionOrderId == productionOrderId && 
                       (r.Status == ReservationStatus.Active || r.Status == ReservationStatus.PartiallyConsumed))
            .ToListAsync();
    }
}
