using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IInventoryReservationRepository : IRepository<InventoryReservation>
{
    Task<IEnumerable<InventoryReservation>> GetByProductionOrderIdAsync(Guid productionOrderId);
    Task<IEnumerable<InventoryReservation>> GetActiveByProductionOrderIdAsync(Guid productionOrderId);
}
