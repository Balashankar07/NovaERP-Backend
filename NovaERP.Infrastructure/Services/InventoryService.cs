using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Inventory.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class InventoryService : IInventoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly IInventoryMovementService _inventoryMovementService;

    public InventoryService(IUnitOfWork unitOfWork, IAuditLogger auditLogger, IInventoryMovementService inventoryMovementService)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _inventoryMovementService = inventoryMovementService;
    }

    public async Task<PagedResult<InventoryDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var result = await _unitOfWork.Inventories.GetAllPagedAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return new PagedResult<InventoryDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<InventoryDto?> GetByIdAsync(Guid id)
    {
        var inventory = await _unitOfWork.Inventories.GetByIdAsync(id);
        return inventory == null ? null : MapToDto(inventory);
    }

    public async Task<List<InventoryDto>> GetByProductIdAsync(Guid productId)
    {
        var inventories = await _unitOfWork.Inventories.GetByProductIdAsync(productId);
        return inventories.Select(MapToDto).ToList();
    }

    public async Task<PagedResult<InventoryDto>> GetByWarehouseIdAsync(Guid warehouseId, int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var result = await _unitOfWork.Inventories.GetByWarehouseIdAsync(warehouseId, pageNumber, pageSize, search, sortBy, sortOrder);
        return new PagedResult<InventoryDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<PagedResult<InventoryTransactionDto>> GetTransactionsAsync(Guid inventoryId, int pageNumber = 1, int pageSize = 10)
    {
        var result = await _unitOfWork.InventoryTransactions.GetByInventoryIdAsync(inventoryId, pageNumber, pageSize);
        return new PagedResult<InventoryTransactionDto>
        {
            Items = result.Items.Select(MapTransactionToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }
    public async Task<PagedResult<GlobalInventoryTransactionDto>> GetAllTransactionsAsync(int pageNumber = 1, int pageSize = 20, string? search = null, string? transactionType = null, Guid? warehouseId = null, Guid? productId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var result = await _unitOfWork.InventoryTransactions.GetAllTransactionsAsync(pageNumber, pageSize, search, transactionType, warehouseId, productId, startDate, endDate);
        return new PagedResult<GlobalInventoryTransactionDto>
        {
            Items = result.Items.Select(MapGlobalTransactionToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }


    private async Task<Guid> GetDefaultWarehouseIdAsync()
    {
        var defaultWarehouse = await _unitOfWork.Warehouses.GetDefaultWarehouseAsync();
        if (defaultWarehouse == null)
            throw new Exception("No default warehouse is configured. Please set a default warehouse before processing goods receipts.");
        return defaultWarehouse.Id;
    }

    public async Task ProcessSalesDispatchAsync(Guid shipmentId, Guid? currentUserId)
    {
        var shipment = await _unitOfWork.Shipments.GetShipmentWithDetailsAsync(shipmentId);
        if (shipment == null)
            throw new Exception($"Shipment with ID {shipmentId} not found.");

        var warehouseId = await GetDefaultWarehouseIdAsync();

        foreach (var item in shipment.ShipmentItems)
        {
            if (item.Quantity <= 0) continue;

            await _inventoryMovementService.IssueAsync(
                item.ProductId,
                warehouseId,
                null,
                item.Quantity,
                InventoryReferenceType.SalesOrder,
                shipmentId,
                $"Dispatched for Shipment: {shipment.TrackingNumber}",
                currentUserId);
        }
    }

    private static InventoryDto MapToDto(Inventory inv) => new()
    {
        Id = inv.Id,
        ProductId = inv.ProductId,
        ProductCode = inv.Product?.ProductCode ?? string.Empty,
        ProductName = inv.Product?.Name ?? string.Empty,
        WarehouseId = inv.WarehouseId,
        WarehouseName = inv.Warehouse?.WarehouseName ?? string.Empty,
        WarehouseLocationId = inv.WarehouseLocationId,
        LocationName = inv.WarehouseLocation?.LocationName,
        QuantityOnHand = inv.QuantityOnHand,
        QuantityReserved = inv.QuantityReserved,
        QuantityAvailable = inv.QuantityAvailable,
        ReorderLevel = inv.ReorderLevel,
        MinimumLevel = inv.MinimumLevel,
        MaximumLevel = inv.MaximumLevel,
        LastStockUpdate = inv.LastStockUpdate,
        IsActive = inv.IsActive,
        CreatedAt = inv.CreatedAt,
        UpdatedAt = inv.UpdatedAt
    };

    private static InventoryTransactionDto MapTransactionToDto(InventoryTransaction t) => new()
    {
        Id = t.Id,
        InventoryId = t.InventoryId,
        TransactionType = t.TransactionType.ToString(),
        ReferenceType = t.ReferenceType.ToString(),
        ReferenceId = t.ReferenceId,
        Quantity = t.Quantity,
        BalanceAfter = t.BalanceAfter,
        Remarks = t.Remarks,
        CreatedBy = t.CreatedBy,
        CreatedAt = t.CreatedAt
    };
    private static GlobalInventoryTransactionDto MapGlobalTransactionToDto(InventoryTransaction t) => new()
    {
        Id = t.Id,
        InventoryId = t.InventoryId,
        ProductId = t.Inventory?.ProductId ?? Guid.Empty,
        ProductCode = t.Inventory?.Product?.ProductCode ?? string.Empty,
        ProductName = t.Inventory?.Product?.Name ?? string.Empty,
        WarehouseId = t.Inventory?.WarehouseId ?? Guid.Empty,
        WarehouseName = t.Inventory?.Warehouse?.WarehouseName ?? string.Empty,
        WarehouseLocationId = t.Inventory?.WarehouseLocationId,
        LocationName = t.Inventory?.WarehouseLocation?.LocationName,
        TransactionType = t.TransactionType.ToString(),
        ReferenceType = t.ReferenceType.ToString(),
        ReferenceId = t.ReferenceId,
        Quantity = t.Quantity,
        BalanceAfter = t.BalanceAfter,
        Remarks = t.Remarks,
        CreatedBy = t.CreatedBy,
        CreatedByName = string.Empty, // Will be fetched separately if needed or left empty
        CreatedAt = t.CreatedAt
    };
}
