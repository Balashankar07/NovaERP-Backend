using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IShipmentRepository : IRepository<Shipment>
{
    Task<Shipment?> GetShipmentWithDetailsAsync(Guid id);
    Task<List<Shipment>> GetDeliveredShipmentsWithDetailsAsync();
    Task<int> GetCountAsync();
}
