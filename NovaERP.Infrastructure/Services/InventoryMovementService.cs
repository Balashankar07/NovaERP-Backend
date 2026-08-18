using NovaERP.Application.Features.Inventory.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class InventoryMovementService : IInventoryMovementService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;

    public InventoryMovementService(IUnitOfWork unitOfWork, IAuditLogger auditLogger)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
    }

    public async Task<InventoryDto> ReceiveAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantity, InventoryReferenceType refType, Guid? refId, string remarks, Guid? currentUserId)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));

        var inventory = await _unitOfWork.Inventories.GetByProductAndLocationAsync(productId, warehouseId, locationId);
        
        if (inventory == null)
        {
            inventory = new Inventory
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                WarehouseId = warehouseId,
                WarehouseLocationId = locationId,
                QuantityOnHand = quantity,
                QuantityReserved = 0,
                QuantityAvailable = quantity,
                LastStockUpdate = DateTime.UtcNow,
                IsActive = true
            };
            await _unitOfWork.Inventories.AddAsync(inventory);
        }
        else
        {
            inventory.QuantityOnHand += quantity;
            inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
            inventory.LastStockUpdate = DateTime.UtcNow;
            
            AssertInvariants(inventory);
            _unitOfWork.Inventories.Update(inventory);
        }

        await AppendTransaction(inventory.Id, InventoryTransactionType.GoodsReceipt, refType, refId, quantity, inventory.QuantityOnHand, remarks, currentUserId);
        
        return MapToDto(inventory);
    }

    public async Task<InventoryDto> IssueAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantity, InventoryReferenceType refType, Guid? refId, string remarks, Guid? currentUserId, Guid? reservationId = null)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));

        var inventory = await _unitOfWork.Inventories.GetByProductAndLocationAsync(productId, warehouseId, locationId);
        if (inventory == null)
            throw new InvalidOperationException($"Insufficient inventory available for Product {productId}.");

        if (reservationId.HasValue)
        {
            var reservation = await _unitOfWork.InventoryReservations.GetByIdAsync(reservationId.Value);
            if (reservation == null || reservation.Status == ReservationStatus.Released || reservation.Status == ReservationStatus.Consumed)
                throw new InvalidOperationException($"Invalid or inactive reservation {reservationId}.");

            if (reservation.InventoryId != inventory.Id)
                throw new InvalidOperationException($"Reservation {reservationId} is for a different inventory location.");

            decimal remainingReservation = reservation.QuantityReserved - reservation.QuantityConsumed;
            if (quantity > remainingReservation)
                throw new InvalidOperationException($"Cannot consume more than the remaining reserved quantity. Required: {quantity}, Remaining Reserved: {remainingReservation}");

            reservation.QuantityConsumed += quantity;
            if (reservation.QuantityConsumed >= reservation.QuantityReserved)
                reservation.Status = ReservationStatus.Consumed;
            else
                reservation.Status = ReservationStatus.PartiallyConsumed;

            _unitOfWork.InventoryReservations.Update(reservation);

            inventory.QuantityOnHand -= quantity;
            inventory.QuantityReserved -= quantity;
            inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
        }
        else
        {
            if (inventory.QuantityAvailable < quantity)
                throw new InvalidOperationException($"Insufficient inventory available for Product {productId}. Required: {quantity}, Available: {inventory.QuantityAvailable}");

            inventory.QuantityOnHand -= quantity;
            inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
        }

        inventory.LastStockUpdate = DateTime.UtcNow;

        AssertInvariants(inventory);
        _unitOfWork.Inventories.Update(inventory);

        await AppendTransaction(inventory.Id, InventoryTransactionType.ProductionIssue, refType, refId, -quantity, inventory.QuantityOnHand, remarks, currentUserId);

        return MapToDto(inventory);
    }

    public async Task<InventoryDto> ReserveAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantity, InventoryReferenceType refType, Guid? refId, string remarks, Guid? currentUserId)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));

        var inventory = await _unitOfWork.Inventories.GetByProductAndLocationAsync(productId, warehouseId, locationId);
        if (inventory == null || inventory.QuantityAvailable < quantity)
            throw new InvalidOperationException($"Insufficient inventory to reserve for Product {productId}. Required: {quantity}, Available: {inventory?.QuantityAvailable ?? 0}");

        inventory.QuantityReserved += quantity;
        inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
        inventory.LastStockUpdate = DateTime.UtcNow;

        AssertInvariants(inventory);
        _unitOfWork.Inventories.Update(inventory);

        // A reservation transaction is conceptually a state change but doesn't change physical balance. 
        // We log it as a 0 quantity transaction with remarks or just let it exist. 
        // Currently no dedicated InventoryTransactionType for Reservation, we can use StockAdjustment or Manual with 0 qty just for audit, or skip transaction table and rely on AuditLog.
        // Let's create an audit log instead of physical transaction since OnHand hasn't moved, or append a transaction with 0 qty.
        await _auditLogger.LogAsync("Reserve", "Inventory", inventory.Id.ToString(), newValues: $"Reserved +{quantity}");

        return MapToDto(inventory);
    }

    public async Task<InventoryDto> ReleaseReservationAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantity, InventoryReferenceType refType, Guid? refId, string remarks, Guid? currentUserId)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));

        var inventory = await _unitOfWork.Inventories.GetByProductAndLocationAsync(productId, warehouseId, locationId);
        if (inventory == null || inventory.QuantityReserved < quantity)
            throw new InvalidOperationException($"Insufficient reserved inventory to release for Product {productId}. Required: {quantity}, Reserved: {inventory?.QuantityReserved ?? 0}");

        inventory.QuantityReserved -= quantity;
        inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
        inventory.LastStockUpdate = DateTime.UtcNow;

        AssertInvariants(inventory);
        _unitOfWork.Inventories.Update(inventory);

        await _auditLogger.LogAsync("Release", "Inventory", inventory.Id.ToString(), newValues: $"Released -{quantity}");

        return MapToDto(inventory);
    }

    public async Task<InventoryDto> AdjustAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantityDelta, string reason, Guid? currentUserId)
    {
        if (quantityDelta == 0) throw new ArgumentException("Quantity delta cannot be zero.", nameof(quantityDelta));

        var inventory = await _unitOfWork.Inventories.GetByProductAndLocationAsync(productId, warehouseId, locationId);
        
        if (inventory == null && quantityDelta > 0)
        {
            inventory = new Inventory
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                WarehouseId = warehouseId,
                WarehouseLocationId = locationId,
                QuantityOnHand = quantityDelta,
                QuantityReserved = 0,
                QuantityAvailable = quantityDelta,
                LastStockUpdate = DateTime.UtcNow,
                IsActive = true
            };
            await _unitOfWork.Inventories.AddAsync(inventory);
        }
        else if (inventory == null && quantityDelta < 0)
        {
             throw new InvalidOperationException($"Cannot apply negative adjustment to non-existent inventory for Product {productId}.");
        }
        else if (inventory != null)
        {
            if (inventory.QuantityAvailable + quantityDelta < 0)
                throw new InvalidOperationException($"Insufficient inventory available for adjustment. Available: {inventory.QuantityAvailable}, Adjustment: {quantityDelta}");

            inventory.QuantityOnHand += quantityDelta;
            inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
            inventory.LastStockUpdate = DateTime.UtcNow;

            AssertInvariants(inventory);
            _unitOfWork.Inventories.Update(inventory);
        }

        await AppendTransaction(inventory!.Id, InventoryTransactionType.StockAdjustment, InventoryReferenceType.Manual, null, quantityDelta, inventory.QuantityOnHand, reason, currentUserId);
        
        return MapToDto(inventory);
    }

    public async Task TransferAsync(Guid productId, Guid sourceWarehouseId, Guid? sourceLocationId, Guid destWarehouseId, Guid? destLocationId, decimal quantity, string reason, Guid? currentUserId)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));

        var sourceInv = await _unitOfWork.Inventories.GetByProductAndLocationAsync(productId, sourceWarehouseId, sourceLocationId);
        if (sourceInv == null || sourceInv.QuantityAvailable < quantity)
            throw new InvalidOperationException($"Insufficient source inventory for transfer. Available: {sourceInv?.QuantityAvailable ?? 0}");

        // Issue from source
        sourceInv.QuantityOnHand -= quantity;
        sourceInv.QuantityAvailable = sourceInv.QuantityOnHand - sourceInv.QuantityReserved;
        sourceInv.LastStockUpdate = DateTime.UtcNow;
        AssertInvariants(sourceInv);
        _unitOfWork.Inventories.Update(sourceInv);
        await AppendTransaction(sourceInv.Id, InventoryTransactionType.StockTransfer, InventoryReferenceType.Manual, null, -quantity, sourceInv.QuantityOnHand, $"Transfer Out: {reason}", currentUserId);

        // Receive to destination
        var destInv = await _unitOfWork.Inventories.GetByProductAndLocationAsync(productId, destWarehouseId, destLocationId);
        if (destInv == null)
        {
            destInv = new Inventory
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                WarehouseId = destWarehouseId,
                WarehouseLocationId = destLocationId,
                QuantityOnHand = quantity,
                QuantityReserved = 0,
                QuantityAvailable = quantity,
                LastStockUpdate = DateTime.UtcNow,
                IsActive = true
            };
            await _unitOfWork.Inventories.AddAsync(destInv);
        }
        else
        {
            destInv.QuantityOnHand += quantity;
            destInv.QuantityAvailable = destInv.QuantityOnHand - destInv.QuantityReserved;
            destInv.LastStockUpdate = DateTime.UtcNow;
            AssertInvariants(destInv);
            _unitOfWork.Inventories.Update(destInv);
        }
        await AppendTransaction(destInv.Id, InventoryTransactionType.StockTransfer, InventoryReferenceType.Manual, null, quantity, destInv.QuantityOnHand, $"Transfer In: {reason}", currentUserId);
    }

    // Phase 3A Extensions
    public async Task ReserveForRequirementAsync(Guid productionOrderId, Guid requirementId, Guid productId, decimal quantityRequired, Guid? currentUserId)
    {
        if (quantityRequired <= 0) return;

        var inventories = await _unitOfWork.Inventories.GetByProductIdAsync(productId);
        var availableInventories = inventories
            .Where(i => i.QuantityAvailable > 0)
            .OrderBy(i => i.CreatedAt)
            .ToList();

        decimal remainingToReserve = quantityRequired;

        foreach (var inv in availableInventories)
        {
            if (remainingToReserve <= 0) break;

            decimal qtyToReserveFromThisInv = Math.Min(remainingToReserve, inv.QuantityAvailable);

            inv.QuantityReserved += qtyToReserveFromThisInv;
            inv.QuantityAvailable = inv.QuantityOnHand - inv.QuantityReserved;
            inv.LastStockUpdate = DateTime.UtcNow;

            AssertInvariants(inv);
            _unitOfWork.Inventories.Update(inv);

            var reservation = new InventoryReservation
            {
                ProductionOrderId = productionOrderId,
                ProductionOrderRequirementId = requirementId,
                InventoryId = inv.Id,
                ProductId = productId,
                WarehouseId = inv.WarehouseId,
                WarehouseLocationId = inv.WarehouseLocationId,
                QuantityReserved = qtyToReserveFromThisInv,
                QuantityConsumed = 0,
                Status = ReservationStatus.Active,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.InventoryReservations.AddAsync(reservation);

            remainingToReserve -= qtyToReserveFromThisInv;
            
            await _auditLogger.LogAsync("Reserve", "Inventory", inv.Id.ToString(), newValues: $"Reserved +{qtyToReserveFromThisInv} for ProductionOrder {productionOrderId}");
        }

        if (remainingToReserve > 0)
        {
            throw new InvalidOperationException($"Insufficient inventory available to reserve for Product {productId}. Short by {remainingToReserve}.");
        }
    }

    public async Task ReleaseUnusedReservationsAsync(Guid productionOrderId, Guid? currentUserId)
    {
        var reservations = await _unitOfWork.InventoryReservations.GetActiveByProductionOrderIdAsync(productionOrderId);
        foreach (var reservation in reservations)
        {
            decimal unusedQty = reservation.QuantityReserved - reservation.QuantityConsumed;
            if (unusedQty > 0)
            {
                var inventory = await _unitOfWork.Inventories.GetByIdAsync(reservation.InventoryId);
                if (inventory != null)
                {
                    inventory.QuantityReserved -= unusedQty;
                    inventory.QuantityAvailable = inventory.QuantityOnHand - inventory.QuantityReserved;
                    inventory.LastStockUpdate = DateTime.UtcNow;

                    AssertInvariants(inventory);
                    _unitOfWork.Inventories.Update(inventory);
                    await _auditLogger.LogAsync("Release", "Inventory", inventory.Id.ToString(), newValues: $"Released +{unusedQty} unused reservation for ProductionOrder {productionOrderId}");
                }
            }

            reservation.Status = ReservationStatus.Released;
            reservation.ReleasedAt = DateTime.UtcNow;
            reservation.UpdatedBy = currentUserId;
            reservation.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.InventoryReservations.Update(reservation);
        }
    }

    private void AssertInvariants(Inventory inventory)
    {
        if (inventory.QuantityOnHand < 0) throw new InvalidOperationException($"Invariant violation: QuantityOnHand ({inventory.QuantityOnHand}) cannot be negative.");
        if (inventory.QuantityReserved < 0) throw new InvalidOperationException($"Invariant violation: QuantityReserved ({inventory.QuantityReserved}) cannot be negative.");
        if (inventory.QuantityReserved > inventory.QuantityOnHand) throw new InvalidOperationException($"Invariant violation: QuantityReserved ({inventory.QuantityReserved}) cannot exceed QuantityOnHand ({inventory.QuantityOnHand}).");
        if (inventory.QuantityAvailable != inventory.QuantityOnHand - inventory.QuantityReserved) throw new InvalidOperationException("Invariant violation: QuantityAvailable must equal QuantityOnHand - QuantityReserved.");
        if (inventory.QuantityAvailable < 0) throw new InvalidOperationException($"Invariant violation: QuantityAvailable ({inventory.QuantityAvailable}) cannot be negative.");
    }

    private async Task AppendTransaction(Guid inventoryId, InventoryTransactionType txnType, InventoryReferenceType refType, Guid? refId, decimal quantity, decimal balanceAfter, string remarks, Guid? currentUserId)
    {
        var transaction = new InventoryTransaction
        {
            InventoryId = inventoryId,
            TransactionType = txnType,
            ReferenceType = refType,
            ReferenceId = refId,
            Quantity = quantity,
            BalanceAfter = balanceAfter,
            Remarks = remarks,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };
        await _unitOfWork.InventoryTransactions.AddTransactionAsync(transaction);
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
        LastStockUpdate = inv.LastStockUpdate
    };
}
