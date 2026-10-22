using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IWarehouseRepository : IRepository<Warehouse>
{
    Task<bool> ExistsByCodeAsync(string warehouseCode);
    Task<Warehouse?> GetByCodeAsync(string warehouseCode);
    Task<bool> HasDefaultWarehouseAsync(Guid? excludeWarehouseId = null);
    Task<Warehouse?> GetDefaultWarehouseAsync();
}
