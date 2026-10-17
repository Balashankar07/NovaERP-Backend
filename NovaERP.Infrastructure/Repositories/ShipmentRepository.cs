using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class ShipmentRepository : Repository<Shipment>, IShipmentRepository
{
    public ShipmentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Shipment?> GetShipmentWithDetailsAsync(Guid id)
    {
        return await _context.Shipments
            .Include(s => s.ShipmentItems)
                .ThenInclude(si => si.Product)
            .Include(s => s.SalesOrder)
            .FirstOrDefaultAsync(s => s.Id == id);
    }
    public async Task<int> GetCountAsync()
    {
        return await _context.Shipments.CountAsync();
    }

    public override async Task<NovaERP.Application.Common.Models.PagedResult<Shipment>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var query = _context.Shipments.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(s => s.TrackingNumber.Contains(search) || (s.CourierName != null && s.CourierName.Contains(search)));
        }

        var totalCount = await query.CountAsync();
        
        // Sort by CreatedAt descending to show newest shipments first
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new NovaERP.Application.Common.Models.PagedResult<Shipment>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}
