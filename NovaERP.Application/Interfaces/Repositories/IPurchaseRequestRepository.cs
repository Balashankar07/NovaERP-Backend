using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IPurchaseRequestRepository : IRepository<PurchaseRequest>
{
    Task<PurchaseRequest?> GetByIdWithItemsAsync(Guid id);
    Task<PurchaseRequest?> GetByRequestNumberAsync(string requestNumber);
    Task<string> GeneratePRNumberAsync();
    IQueryable<PurchaseRequest> GetQueryable();
}
