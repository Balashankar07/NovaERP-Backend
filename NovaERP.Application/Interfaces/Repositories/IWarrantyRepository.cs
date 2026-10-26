using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IWarrantyRepository : IRepository<Warranty>
{
    Task<bool> ExistsBySerialNumberAsync(string serialNumber);
    Task<bool> ExistsForProductAndShipmentAsync(Guid productId, Guid shipmentId);
    Task<int> GetCountForProductAndShipmentAsync(Guid productId, Guid shipmentId);
}
