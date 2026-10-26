using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class WarrantyRepository : Repository<Warranty>, IWarrantyRepository
{
    public WarrantyRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> ExistsBySerialNumberAsync(string serialNumber)
    {
        return await _context.Set<Warranty>().AnyAsync(w => w.SerialNumber == serialNumber);
    }

    public async Task<bool> ExistsForProductAndShipmentAsync(Guid productId, Guid shipmentId)
    {
        return await _context.Set<Warranty>().AnyAsync(w => w.ProductId == productId && w.ShipmentId == shipmentId);
    }

    public override async Task<PagedResult<Warranty>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var query = _context.Set<Warranty>()
            .Include(w => w.Product)
            .Include(w => w.Shipment)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(w =>
                w.SerialNumber.ToLower().Contains(s) ||
                w.WarrantyType.ToLower().Contains(s) ||
                (w.Product != null && (w.Product.Name.ToLower().Contains(s) || w.Product.ProductCode.ToLower().Contains(s))) ||
                (w.Shipment != null && w.Shipment.TrackingNumber.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();
        var items = await query.OrderByDescending(w => w.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Warranty>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public override async Task<Warranty?> GetByIdAsync(Guid id)
    {
        return await _context.Set<Warranty>()
            .Include(w => w.Product)
            .Include(w => w.Shipment)
            .FirstOrDefaultAsync(w => w.Id == id);
    }
}
