using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Inventory.DTOs;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class WarehouseTraceabilityService : IWarehouseTraceabilityService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;

    public WarehouseTraceabilityService(AppDbContext context, IAuditLogger auditLogger)
    {
        _context = context;
        _auditLogger = auditLogger;
    }

    // ──────────────────────────────────────────────────────────────────────
    // 1. LOCATION HIERARCHY
    // ──────────────────────────────────────────────────────────────────────

    public async Task<List<HierarchicalLocationDto>> GetLocationHierarchyAsync(Guid warehouseId)
    {
        var allLocations = await _context.WarehouseLocations
            .Include(l => l.Warehouse)
            .Where(l => l.WarehouseId == warehouseId)
            .ToListAsync();

        var rootLocations = allLocations
            .Where(l => l.ParentLocationId == null)
            .Select(l => MapToHierarchicalDto(l, allLocations))
            .ToList();

        return rootLocations;
    }

    public async Task<HierarchicalLocationDto> CreateLocationAsync(CreateHierarchicalLocationDto dto, Guid? currentUserId)
    {
        var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);
        if (warehouse == null)
            throw new InvalidOperationException($"Warehouse with ID '{dto.WarehouseId}' was not found.");

        // Hierarchy validation rule:
        // Zone (0): No parent
        // Rack (1): Parent must be Zone
        // Shelf (2): Parent must be Rack
        // Bin (3): Parent must be Shelf
        if (dto.Type == LocationType.Zone && dto.ParentLocationId.HasValue)
        {
            throw new InvalidOperationException("Validation Error: Zone cannot have a parent location.");
        }

        if (dto.ParentLocationId.HasValue)
        {
            var parent = await _context.WarehouseLocations.FindAsync(dto.ParentLocationId.Value);
            if (parent == null)
                throw new InvalidOperationException($"Parent location '{dto.ParentLocationId}' not found.");

            if (parent.WarehouseId != dto.WarehouseId)
                throw new InvalidOperationException("Validation Error: Parent location must belong to the exact same warehouse.");

            if (dto.Type == LocationType.Rack && parent.Type != LocationType.Zone)
                throw new InvalidOperationException("Validation Error: Rack parent must be a Zone.");

            if (dto.Type == LocationType.Shelf && parent.Type != LocationType.Rack)
                throw new InvalidOperationException("Validation Error: Shelf parent must be a Rack.");

            if (dto.Type == LocationType.Bin && parent.Type != LocationType.Shelf)
                throw new InvalidOperationException("Validation Error: Bin parent must be a Shelf.");
        }
        else if (dto.Type != LocationType.Zone)
        {
            throw new InvalidOperationException($"Validation Error: Location of type '{dto.Type}' must have a valid parent location.");
        }

        // Unique code check within warehouse
        bool codeExists = await _context.WarehouseLocations.AnyAsync(l => l.WarehouseId == dto.WarehouseId && l.LocationCode.ToLower() == dto.LocationCode.ToLower());
        if (codeExists)
            throw new InvalidOperationException($"Duplicate location code '{dto.LocationCode}' in warehouse '{warehouse.WarehouseName}'.");

        var location = new WarehouseLocation
        {
            Id = Guid.NewGuid(),
            WarehouseId = dto.WarehouseId,
            ParentLocationId = dto.ParentLocationId,
            Type = dto.Type,
            LocationCode = dto.LocationCode,
            LocationName = dto.LocationName,
            Zone = dto.Zone,
            Rack = dto.Rack,
            Shelf = dto.Shelf,
            Bin = dto.Bin,
            Description = dto.Description,
            IsActive = true,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.WarehouseLocations.AddAsync(location);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("CreateLocation", "WarehouseLocation", location.Id.ToString(), newValues: $"Created Location {location.LocationCode} ({location.Type})");

        return MapToHierarchicalDto(location, new List<WarehouseLocation>());
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2. PRODUCT TRACKING CONFIGURATION
    // ──────────────────────────────────────────────────────────────────────

    public async Task UpdateProductTrackingModeAsync(Guid productId, TrackingMode mode, Guid? currentUserId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            throw new InvalidOperationException($"Product '{productId}' not found.");

        if (product.TrackingMode == mode) return;

        product.TrackingMode = mode;
        product.UpdatedBy = currentUserId;
        product.UpdatedAt = DateTime.UtcNow;

        _context.Products.Update(product);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("UpdateTrackingMode", "Product", productId.ToString(), newValues: $"Updated tracking mode to {mode}");
    }

    // ──────────────────────────────────────────────────────────────────────
    // 3. BATCH / LOT MANAGEMENT
    // ──────────────────────────────────────────────────────────────────────

    public async Task<PagedResult<InventoryBatchDto>> GetBatchesAsync(int pageNumber, int pageSize, Guid? productId, Guid? warehouseId, BatchStatus? status)
    {
        var query = _context.InventoryBatches
            .Include(b => b.Product)
            .Include(b => b.Warehouse)
            .Include(b => b.WarehouseLocation)
            .AsNoTracking()
            .AsQueryable();

        if (productId.HasValue) query = query.Where(b => b.ProductId == productId.Value);
        if (warehouseId.HasValue) query = query.Where(b => b.WarehouseId == warehouseId.Value);
        if (status.HasValue) query = query.Where(b => b.Status == status.Value);

        int totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(b => MapBatchToDto(b))
            .ToListAsync();

        return new PagedResult<InventoryBatchDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<InventoryBatchDto> CreateBatchAsync(CreateInventoryBatchDto dto, Guid? currentUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.BatchNumber))
            throw new InvalidOperationException("Batch number is required.");

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
            throw new InvalidOperationException($"Product '{dto.ProductId}' not found.");

        var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);
        if (warehouse == null)
            throw new InvalidOperationException($"Warehouse '{dto.WarehouseId}' not found.");

        bool exists = await _context.InventoryBatches.AnyAsync(b => b.ProductId == dto.ProductId && b.BatchNumber.ToLower() == dto.BatchNumber.ToLower());
        if (exists)
            throw new InvalidOperationException($"Batch '{dto.BatchNumber}' already exists for product '{product.Name}'.");

        if (dto.InitialQuantity < 0)
            throw new InvalidOperationException("Batch quantity cannot be negative.");

        var batch = new InventoryBatch
        {
            Id = Guid.NewGuid(),
            BatchNumber = dto.BatchNumber.Trim(),
            ProductId = dto.ProductId,
            WarehouseId = dto.WarehouseId,
            WarehouseLocationId = dto.WarehouseLocationId,
            ManufactureDate = dto.ManufactureDate.HasValue ? DateTime.SpecifyKind(dto.ManufactureDate.Value, DateTimeKind.Utc) : null,
            ExpiryDate = dto.ExpiryDate.HasValue ? DateTime.SpecifyKind(dto.ExpiryDate.Value, DateTimeKind.Utc) : null,
            QuantityOnHand = dto.InitialQuantity,
            QuantityReserved = 0,
            QuantityAvailable = dto.InitialQuantity,
            Status = BatchStatus.Active,
            Barcode = $"LOT-{product.ProductCode}-{dto.BatchNumber.Trim()}",
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.InventoryBatches.AddAsync(batch);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("CreateBatch", "InventoryBatch", batch.Id.ToString(), newValues: $"Created Batch {batch.BatchNumber} for product {product.ProductCode}");

        return MapBatchToDto(batch);
    }

    public async Task<InventoryBatchDto> UpdateBatchStatusAsync(Guid batchId, BatchStatus status, string? remarks, Guid? currentUserId)
    {
        var batch = await _context.InventoryBatches
            .Include(b => b.Product)
            .Include(b => b.Warehouse)
            .Include(b => b.WarehouseLocation)
            .FirstOrDefaultAsync(b => b.Id == batchId);

        if (batch == null)
            throw new InvalidOperationException($"Batch '{batchId}' not found.");

        batch.Status = status;
        batch.UpdatedBy = currentUserId;
        batch.UpdatedAt = DateTime.UtcNow;

        _context.InventoryBatches.Update(batch);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("UpdateBatchStatus", "InventoryBatch", batch.Id.ToString(), newValues: $"Batch {batch.BatchNumber} status set to {status}. Remarks: {remarks}");

        return MapBatchToDto(batch);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 4. SERIAL NUMBER MANAGEMENT
    // ──────────────────────────────────────────────────────────────────────

    public async Task<PagedResult<InventorySerialNumberDto>> GetSerialsAsync(int pageNumber, int pageSize, Guid? productId, Guid? warehouseId, SerialStatus? status)
    {
        var query = _context.InventorySerialNumbers
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .Include(s => s.WarehouseLocation)
            .Include(s => s.Batch)
            .AsNoTracking()
            .AsQueryable();

        if (productId.HasValue) query = query.Where(s => s.ProductId == productId.Value);
        if (warehouseId.HasValue) query = query.Where(s => s.WarehouseId == warehouseId.Value);
        if (status.HasValue) query = query.Where(s => s.Status == status.Value);

        int totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => MapSerialToDto(s))
            .ToListAsync();

        return new PagedResult<InventorySerialNumberDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<List<InventorySerialNumberDto>> RegisterSerialsAsync(RegisterSerialNumbersDto dto, Guid? currentUserId)
    {
        if (dto.SerialNumbers == null || !dto.SerialNumbers.Any())
            throw new InvalidOperationException("At least one serial number is required.");

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
            throw new InvalidOperationException($"Product '{dto.ProductId}' not found.");

        var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);
        if (warehouse == null)
            throw new InvalidOperationException($"Warehouse '{dto.WarehouseId}' not found.");

        var resultList = new List<InventorySerialNumber>();

        foreach (var sn in dto.SerialNumbers)
        {
            string cleanSn = sn.Trim();
            bool exists = await _context.InventorySerialNumbers.AnyAsync(s => s.SerialNumber.ToLower() == cleanSn.ToLower());
            if (exists)
                throw new InvalidOperationException($"Duplicate Serial Number '{cleanSn}'. Serial numbers must be unique across system.");

            var serial = new InventorySerialNumber
            {
                Id = Guid.NewGuid(),
                SerialNumber = cleanSn,
                ProductId = dto.ProductId,
                WarehouseId = dto.WarehouseId,
                WarehouseLocationId = dto.WarehouseLocationId,
                BatchId = dto.BatchId,
                Status = SerialStatus.Available,
                ReceivedAt = DateTime.UtcNow,
                Barcode = $"SN-{product.ProductCode}-{cleanSn}",
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.InventorySerialNumbers.AddAsync(serial);
            resultList.Add(serial);
        }

        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("RegisterSerials", "InventorySerialNumber", dto.ProductId.ToString(), newValues: $"Registered {resultList.Count} serial numbers for product {product.ProductCode}");

        return resultList.Select(s => MapSerialToDto(s)).ToList();
    }

    public async Task<InventorySerialNumberDto> UpdateSerialStatusAsync(Guid serialId, SerialStatus status, string? remarks, Guid? currentUserId)
    {
        var serial = await _context.InventorySerialNumbers
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .Include(s => s.WarehouseLocation)
            .Include(s => s.Batch)
            .FirstOrDefaultAsync(s => s.Id == serialId);

        if (serial == null)
            throw new InvalidOperationException($"Serial number '{serialId}' not found.");

        // Invariant Rule: Serial cannot be simultaneously Available and Issued
        if (status == SerialStatus.Issued)
        {
            serial.IssuedAt = DateTime.UtcNow;
        }
        else if (status == SerialStatus.Available)
        {
            serial.IssuedAt = null;
        }

        serial.Status = status;
        serial.UpdatedBy = currentUserId;
        serial.UpdatedAt = DateTime.UtcNow;

        _context.InventorySerialNumbers.Update(serial);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("UpdateSerialStatus", "InventorySerialNumber", serial.Id.ToString(), newValues: $"Serial {serial.SerialNumber} status set to {status}. Remarks: {remarks}");

        return MapSerialToDto(serial);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 5. DAMAGED / BLOCKED STOCK QUERIES
    // ──────────────────────────────────────────────────────────────────────

    public async Task<PagedResult<InventoryBatchDto>> GetDamagedOrBlockedBatchesAsync(int pageNumber, int pageSize)
    {
        var query = _context.InventoryBatches
            .Include(b => b.Product)
            .Include(b => b.Warehouse)
            .Include(b => b.WarehouseLocation)
            .Where(b => b.Status == BatchStatus.Damaged || b.Status == BatchStatus.Blocked || b.Status == BatchStatus.Quarantine || b.Status == BatchStatus.Expired)
            .AsNoTracking();

        int totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.UpdatedAt ?? b.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(b => MapBatchToDto(b))
            .ToListAsync();

        return new PagedResult<InventoryBatchDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<InventorySerialNumberDto>> GetDamagedOrBlockedSerialsAsync(int pageNumber, int pageSize)
    {
        var query = _context.InventorySerialNumbers
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .Include(s => s.WarehouseLocation)
            .Include(s => s.Batch)
            .Where(s => s.Status == SerialStatus.Damaged || s.Status == SerialStatus.Blocked)
            .AsNoTracking();

        int totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.UpdatedAt ?? s.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => MapSerialToDto(s))
            .ToListAsync();

        return new PagedResult<InventorySerialNumberDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    // ──────────────────────────────────────────────────────────────────────
    // 6. TRACEABILITY TIMELINE & REPORTS
    // ──────────────────────────────────────────────────────────────────────

    public async Task<TraceabilityNodeDto> GetProductTraceabilityAsync(Guid productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            throw new InvalidOperationException($"Product '{productId}' not found.");

        var batches = await _context.InventoryBatches
            .Include(b => b.Warehouse)
            .Include(b => b.WarehouseLocation)
            .Where(b => b.ProductId == productId)
            .Select(b => MapBatchToDto(b))
            .ToListAsync();

        var serials = await _context.InventorySerialNumbers
            .Include(s => s.Warehouse)
            .Include(s => s.WarehouseLocation)
            .Include(s => s.Batch)
            .Where(s => s.ProductId == productId)
            .Select(s => MapSerialToDto(s))
            .ToListAsync();

        // Derives movements directly from persisted InventoryTransactions for this product
        var inventoryIds = await _context.Inventories
            .Where(i => i.ProductId == productId)
            .Select(i => i.Id)
            .ToListAsync();

        var movements = await _context.InventoryTransactions
            .Include(t => t.Inventory)
            .ThenInclude(i => i!.Warehouse)
            .Include(t => t.Inventory)
            .ThenInclude(i => i!.WarehouseLocation)
            .Where(t => inventoryIds.Contains(t.InventoryId))
            .OrderByDescending(t => t.CreatedAt)
            .Take(100)
            .Select(t => new TraceabilityMovementDto
            {
                Id = t.Id,
                Timestamp = t.CreatedAt,
                TransactionType = t.TransactionType.ToString(),
                ReferenceType = t.ReferenceType.ToString(),
                ReferenceId = t.ReferenceId,
                WarehouseName = t.Inventory != null && t.Inventory.Warehouse != null ? t.Inventory.Warehouse.WarehouseName : "N/A",
                LocationName = t.Inventory != null && t.Inventory.WarehouseLocation != null ? t.Inventory.WarehouseLocation.LocationName : "Warehouse Level",
                Quantity = t.Quantity,
                BalanceAfter = t.BalanceAfter,
                Remarks = t.Remarks
            })
            .ToListAsync();

        return new TraceabilityNodeDto
        {
            ProductId = product.Id,
            ProductCode = product.ProductCode,
            ProductName = product.Name,
            TrackingMode = product.TrackingMode,
            Batches = batches,
            Serials = serials,
            Movements = movements
        };
    }

    public async Task<TraceabilityReportsSummaryDto> GetReportsSummaryAsync()
    {
        int totalLocations = await _context.WarehouseLocations.CountAsync();
        int activeBatches = await _context.InventoryBatches.CountAsync(b => b.Status == BatchStatus.Active);
        int expiredBatches = await _context.InventoryBatches.CountAsync(b => b.Status == BatchStatus.Expired);
        int blockedBatches = await _context.InventoryBatches.CountAsync(b => b.Status == BatchStatus.Blocked || b.Status == BatchStatus.Damaged);

        int availableSerials = await _context.InventorySerialNumbers.CountAsync(s => s.Status == SerialStatus.Available);
        int issuedSerials = await _context.InventorySerialNumbers.CountAsync(s => s.Status == SerialStatus.Issued);
        int damagedSerials = await _context.InventorySerialNumbers.CountAsync(s => s.Status == SerialStatus.Damaged || s.Status == SerialStatus.Blocked);

        var locationStock = await _context.Inventories
            .Include(i => i.Warehouse)
            .Include(i => i.WarehouseLocation)
            .Where(i => i.WarehouseLocationId != null)
            .GroupBy(i => new { i.WarehouseId, i.Warehouse!.WarehouseName, i.WarehouseLocationId, i.WarehouseLocation!.LocationCode, i.WarehouseLocation.LocationName, i.WarehouseLocation.Type })
            .Select(g => new LocationStockSummaryDto
            {
                WarehouseName = g.Key.WarehouseName,
                LocationCode = g.Key.LocationCode,
                LocationName = g.Key.LocationName,
                Type = g.Key.Type.ToString(),
                ProductCount = g.Select(x => x.ProductId).Distinct().Count(),
                TotalQuantityOnHand = g.Sum(x => x.QuantityOnHand)
            })
            .ToListAsync();

        return new TraceabilityReportsSummaryDto
        {
            TotalHierarchicalLocations = totalLocations,
            TotalActiveBatches = activeBatches,
            TotalExpiredBatches = expiredBatches,
            TotalBlockedBatches = blockedBatches,
            TotalAvailableSerials = availableSerials,
            TotalIssuedSerials = issuedSerials,
            TotalDamagedSerials = damagedSerials,
            StockByLocation = locationStock
        };
    }

    // ──────────────────────────────────────────────────────────────────────
    // MAPPER HELPERS
    // ──────────────────────────────────────────────────────────────────────

    private static HierarchicalLocationDto MapToHierarchicalDto(WarehouseLocation loc, List<WarehouseLocation> allLocations)
    {
        var children = allLocations
            .Where(c => c.ParentLocationId == loc.Id)
            .Select(c => MapToHierarchicalDto(c, allLocations))
            .ToList();

        return new HierarchicalLocationDto
        {
            Id = loc.Id,
            WarehouseId = loc.WarehouseId,
            WarehouseName = loc.Warehouse?.WarehouseName ?? string.Empty,
            ParentLocationId = loc.ParentLocationId,
            ParentLocationName = loc.ParentLocation?.LocationName,
            Type = loc.Type,
            LocationCode = loc.LocationCode,
            LocationName = loc.LocationName,
            Zone = loc.Zone,
            Rack = loc.Rack,
            Shelf = loc.Shelf,
            Bin = loc.Bin,
            Description = loc.Description,
            IsActive = loc.IsActive,
            ChildLocations = children
        };
    }

    private static InventoryBatchDto MapBatchToDto(InventoryBatch b) => new()
    {
        Id = b.Id,
        BatchNumber = b.BatchNumber,
        ProductId = b.ProductId,
        ProductCode = b.Product?.ProductCode ?? string.Empty,
        ProductName = b.Product?.Name ?? string.Empty,
        WarehouseId = b.WarehouseId,
        WarehouseName = b.Warehouse?.WarehouseName ?? string.Empty,
        WarehouseLocationId = b.WarehouseLocationId,
        LocationName = b.WarehouseLocation?.LocationName,
        ManufactureDate = b.ManufactureDate,
        ExpiryDate = b.ExpiryDate,
        QuantityOnHand = b.QuantityOnHand,
        QuantityReserved = b.QuantityReserved,
        QuantityAvailable = b.QuantityAvailable,
        Status = b.Status,
        Barcode = b.Barcode,
        CreatedAt = b.CreatedAt
    };

    private static InventorySerialNumberDto MapSerialToDto(InventorySerialNumber s) => new()
    {
        Id = s.Id,
        SerialNumber = s.SerialNumber,
        ProductId = s.ProductId,
        ProductCode = s.Product?.ProductCode ?? string.Empty,
        ProductName = s.Product?.Name ?? string.Empty,
        WarehouseId = s.WarehouseId,
        WarehouseName = s.Warehouse?.WarehouseName ?? string.Empty,
        WarehouseLocationId = s.WarehouseLocationId,
        LocationName = s.WarehouseLocation?.LocationName,
        BatchId = s.BatchId,
        BatchNumber = s.Batch?.BatchNumber,
        Status = s.Status,
        ReceivedAt = s.ReceivedAt,
        IssuedAt = s.IssuedAt,
        CurrentReferenceType = s.CurrentReferenceType,
        CurrentReferenceId = s.CurrentReferenceId,
        Barcode = s.Barcode
    };
}
