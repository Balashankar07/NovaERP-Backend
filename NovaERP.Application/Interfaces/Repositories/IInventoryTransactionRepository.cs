using NovaERP.Application.Common.Models;
using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IInventoryTransactionRepository : IRepository<InventoryTransaction>
{
    Task<PagedResult<InventoryTransaction>> GetByInventoryIdAsync(Guid inventoryId, int pageNumber = 1, int pageSize = 10);
    Task<PagedResult<InventoryTransaction>> GetAllTransactionsAsync(int pageNumber = 1, int pageSize = 20, string? search = null, string? transactionType = null, Guid? warehouseId = null, Guid? productId = null, DateTime? startDate = null, DateTime? endDate = null);
    Task AddTransactionAsync(InventoryTransaction transaction);
}
