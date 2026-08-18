using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class PurchaseRequestRepository : Repository<PurchaseRequest>, IPurchaseRequestRepository
{
    public PurchaseRequestRepository(AppDbContext dbContext) : base(dbContext)
    {
    }

    public async Task<PurchaseRequest?> GetByIdWithItemsAsync(Guid id)
    {
        return await _context.PurchaseRequests
            .Include(x => x.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<PurchaseRequest?> GetByRequestNumberAsync(string requestNumber)
    {
        return await _context.PurchaseRequests
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.RequestNumber == requestNumber);
    }

    public IQueryable<PurchaseRequest> GetQueryable()
    {
        return _context.PurchaseRequests.AsQueryable();
    }

    public async Task<string> GeneratePRNumberAsync()
    {
        var prefix = "PR-";
        var datePart = DateTime.UtcNow.ToString("yyyyMM");
        
        var lastPR = await _context.PurchaseRequests
            .Where(pr => pr.RequestNumber.StartsWith(prefix + datePart))
            .OrderByDescending(pr => pr.RequestNumber)
            .FirstOrDefaultAsync();

        if (lastPR == null)
        {
            return $"{prefix}{datePart}-0001";
        }

        var sequenceStr = lastPR.RequestNumber.Substring(lastPR.RequestNumber.LastIndexOf('-') + 1);
        if (int.TryParse(sequenceStr, out int sequence))
        {
            return $"{prefix}{datePart}-{(sequence + 1):D4}";
        }

        return $"{prefix}{datePart}-0001";
    }
}
