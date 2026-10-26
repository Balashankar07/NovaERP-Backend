using System;
using System.Linq;
using System.Threading.Tasks;
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

    public async Task<int> GetCountForProductAndShipmentAsync(Guid productId, Guid shipmentId)
    {
        return await _context.Set<Warranty>().CountAsync(w => w.ProductId == productId && w.ShipmentId == shipmentId);
    }

    public async Task<int> GetMaxSequenceNumberForPrefixAsync(string prefix)
    {
        var pattern = $"SN-{prefix}-";
        var serials = await _context.Set<Warranty>()
            .Where(w => w.SerialNumber.StartsWith(pattern))
            .Select(w => w.SerialNumber)
            .ToListAsync();

        int maxSeq = 0;
        foreach (var s in serials)
        {
            var parts = s.Split('-');
            if (parts.Length == 3 && parts[1].Equals(prefix, StringComparison.OrdinalIgnoreCase))
            {
                if (int.TryParse(parts[2], out int num) && num > maxSeq)
                {
                    maxSeq = num;
                }
            }
        }
        return maxSeq;
    }

    private static string GetSequenceName(string prefix)
    {
        var clean = System.Text.RegularExpressions.Regex.Replace(prefix, @"[^A-Za-z0-9_]", "");
        if (string.IsNullOrWhiteSpace(clean)) clean = "GEN";
        return $"WarrantySeq_{clean}";
    }

#pragma warning disable EF1002
    public async Task<long> PeekNextSequenceValueAsync(string prefix, long minStartValue = 1)
    {
        var seqName = GetSequenceName(prefix);
        try
        {
            var result = await _context.Database
                .SqlQueryRaw<long>($"SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END FROM \"{seqName}\"")
                .ToListAsync();
            return Math.Max(result.First(), minStartValue);
        }
        catch
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    $"CREATE SEQUENCE IF NOT EXISTS \"{seqName}\" START WITH {minStartValue};");
            }
            catch { }
            return minStartValue;
        }
    }

    public async Task<long> GetNextSequenceValueAsync(string prefix, long minStartValue = 1)
    {
        var seqName = GetSequenceName(prefix);
        try
        {
            var result = await _context.Database
                .SqlQueryRaw<long>($"SELECT nextval('\"{seqName}\"')")
                .ToListAsync();
            var val = result.First();
            if (val < minStartValue)
            {
                await _context.Database.ExecuteSqlRawAsync(
                    $"ALTER SEQUENCE \"{seqName}\" RESTART WITH {minStartValue + 1};");
                return minStartValue;
            }
            return val;
        }
        catch
        {
            await _context.Database.ExecuteSqlRawAsync(
                $"CREATE SEQUENCE IF NOT EXISTS \"{seqName}\" START WITH {minStartValue};");
            var result = await _context.Database
                .SqlQueryRaw<long>($"SELECT nextval('\"{seqName}\"')")
                .ToListAsync();
            return Math.Max(result.First(), minStartValue);
        }
    }

    public async Task SetSequenceValueIfLowerAsync(string prefix, long targetValue)
    {
        var seqName = GetSequenceName(prefix);
        try
        {
            var result = await _context.Database
                .SqlQueryRaw<long>($"SELECT last_value FROM \"{seqName}\"")
                .ToListAsync();
            if (result.First() < targetValue)
            {
                await _context.Database.ExecuteSqlRawAsync(
                    $"ALTER SEQUENCE \"{seqName}\" RESTART WITH {targetValue};");
            }
        }
        catch
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    $"CREATE SEQUENCE IF NOT EXISTS \"{seqName}\" START WITH {targetValue};");
            }
            catch { }
        }
    }
#pragma warning restore EF1002

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
