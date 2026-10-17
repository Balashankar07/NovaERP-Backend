using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IShipmentRepository : IRepository<Shipment>
{
    Task<Shipment?> GetShipmentWithDetailsAsync(Guid id);
    Task<int> GetCountAsync();
}
