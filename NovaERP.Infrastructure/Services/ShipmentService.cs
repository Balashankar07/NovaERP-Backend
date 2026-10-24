using NovaERP.Application.Common.Models;
using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.Features.Shipments.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class ShipmentService : IShipmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IInventoryMovementService _inventoryMovementService;
    private readonly IAuditLogger _auditLogger;
    private readonly INotificationService _notificationService;

    public ShipmentService(
        IUnitOfWork unitOfWork, 
        IInventoryMovementService inventoryMovementService, 
        IAuditLogger auditLogger,
        INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _inventoryMovementService = inventoryMovementService;
        _auditLogger = auditLogger;
        _notificationService = notificationService;
    }

    public async Task<PagedResult<ShipmentDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var result = await _unitOfWork.Shipments.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return new PagedResult<ShipmentDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<ShipmentDto?> GetByIdAsync(Guid id)
    {
        var shipment = await _unitOfWork.Shipments.GetShipmentWithDetailsAsync(id);
        return shipment == null ? null : MapToDto(shipment);
    }

    public async Task<ShipmentDto> CreateAsync(CreateShipmentDto dto, Guid currentUserId)
    {
        var salesOrder = await _unitOfWork.SalesOrders.GetSalesOrderWithDetailsAsync(dto.SalesOrderId);
        if (salesOrder == null)
            throw new KeyNotFoundException($"Sales Order with ID {dto.SalesOrderId} not found.");

        if (salesOrder.Status != SalesOrderStatus.Reserved && salesOrder.Status != SalesOrderStatus.PartiallyShipped)
            throw new BadRequestException("Sales Order must be Reserved or PartiallyShipped before creating a shipment.");

        string trackingNumber = dto.TrackingNumber;
        if (string.IsNullOrWhiteSpace(trackingNumber))
        {
            int count = await _unitOfWork.Shipments.GetCountAsync();
            trackingNumber = $"TRK-{DateTime.UtcNow:yyyyMMdd}-{(count + 1):D4}";
        }

        var shipment = new Shipment
        {
            SalesOrderId = dto.SalesOrderId,
            TrackingNumber = trackingNumber,
            CourierName = dto.CourierName,
            Status = ShipmentStatus.Pending,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var itemDto in dto.ShipmentItems)
        {
            var orderedItem = salesOrder.SalesOrderItems.FirstOrDefault(i => i.ProductId == itemDto.ProductId);
            if (orderedItem == null)
                throw new BadRequestException($"Product ID {itemDto.ProductId} is not in the Sales Order.");

            if (itemDto.Quantity <= 0)
                throw new BadRequestException($"Shipment quantity must be greater than zero for Product ID {itemDto.ProductId}.");

            decimal remainingOrdered = orderedItem.Quantity - orderedItem.ShippedQuantity;
            if (itemDto.Quantity > remainingOrdered)
                throw new BadRequestException($"Shipment quantity {itemDto.Quantity} exceeds remaining ordered quantity {remainingOrdered} for Product ID {itemDto.ProductId}.");

            decimal remainingReserved = orderedItem.ReservedQuantity - orderedItem.ShippedQuantity;
            if (itemDto.Quantity > remainingReserved)
                throw new BadRequestException($"Shipment quantity {itemDto.Quantity} exceeds currently reserved quantity {remainingReserved} for Product ID {itemDto.ProductId}.");

            var shipmentItem = new ShipmentItem
            {
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                DeliveredQuantity = 0,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            shipment.ShipmentItems.Add(shipmentItem);
        }

        await _unitOfWork.Shipments.AddAsync(shipment);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "Shipment", shipment.Id.ToString(), newValues: $"TrackingNumber: {shipment.TrackingNumber}");

        return MapToDto(shipment);
    }

    public async Task UpdateAsync(Guid id, UpdateShipmentDto dto, Guid currentUserId)
    {
        var shipment = await _unitOfWork.Shipments.GetByIdAsync(id);
        if (shipment == null)
            throw new KeyNotFoundException("Shipment not found.");

        if (shipment.Status != ShipmentStatus.Pending)
            throw new BadRequestException("Only Pending shipments can be updated.");

        if (dto.TrackingNumber != null) shipment.TrackingNumber = dto.TrackingNumber;
        if (dto.CourierName != null) shipment.CourierName = dto.CourierName;

        shipment.UpdatedBy = currentUserId;
        shipment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Shipments.Update(shipment);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "Shipment", id.ToString());
    }

    public async Task DeleteAsync(Guid id, Guid currentUserId)
    {
        var shipment = await _unitOfWork.Shipments.GetByIdAsync(id);
        if (shipment == null) return;

        if (shipment.Status != ShipmentStatus.Pending)
            throw new BadRequestException("Only Pending shipments can be deleted.");

        _unitOfWork.Shipments.Delete(shipment);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "Shipment", id.ToString());
    }

    public async Task DispatchAsync(Guid id, Guid currentUserId)
    {
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var shipment = await _unitOfWork.Shipments.GetShipmentWithDetailsAsync(id);
            if (shipment == null)
                throw new KeyNotFoundException("Shipment not found.");

            if (shipment.Status != ShipmentStatus.Pending)
                throw new BadRequestException("Only Pending shipments can be dispatched.");

            var salesOrder = await _unitOfWork.SalesOrders.GetSalesOrderWithDetailsAsync(shipment.SalesOrderId);
            if (salesOrder == null)
                throw new KeyNotFoundException("Sales Order not found.");

            shipment.Status = ShipmentStatus.Dispatched;
            shipment.DispatchDate = DateTime.UtcNow;
            shipment.UpdatedBy = currentUserId;
            shipment.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Shipments.Update(shipment);

            // Deduct Inventory
            var reservations = await _unitOfWork.InventoryReservations.GetActiveBySalesOrderIdAsync(salesOrder.Id);

            foreach (var shipItem in shipment.ShipmentItems)
            {
                var soItem = salesOrder.SalesOrderItems.FirstOrDefault(i => i.ProductId == shipItem.ProductId);
                if (soItem == null) throw new BadRequestException("Product not found in Sales Order.");

                decimal qtyToDispatch = shipItem.Quantity;
                
                var prodReservations = reservations.Where(r => r.ProductId == shipItem.ProductId && r.QuantityReserved > r.QuantityConsumed).ToList();

                foreach(var res in prodReservations)
                {
                    if (qtyToDispatch <= 0) break;

                    decimal availableRes = res.QuantityReserved - res.QuantityConsumed;
                    decimal consumeQty = Math.Min(qtyToDispatch, availableRes);

                    await _inventoryMovementService.IssueAsync(
                        shipItem.ProductId,
                        res.WarehouseId,
                        res.WarehouseLocationId,
                        consumeQty,
                        InventoryReferenceType.SalesOrder,
                        shipment.Id,
                        $"Dispatched for Shipment: {shipment.TrackingNumber}",
                        currentUserId,
                        res.Id
                    );

                    // res.QuantityConsumed is updated inside IssueAsync, so we don't update it here.
                    // The reservation status is also updated there.
                    
                    qtyToDispatch -= consumeQty;
                }

                if (qtyToDispatch > 0)
                {
                    throw new BadRequestException($"Insufficient active reservations to dispatch {shipItem.Quantity} of Product {shipItem.ProductId}.");
                }

                soItem.ShippedQuantity += shipItem.Quantity;
            }

            // Update Sales Order Status
            bool allShipped = salesOrder.SalesOrderItems.All(i => i.ShippedQuantity >= i.Quantity);
            if (allShipped)
            {
                salesOrder.Status = SalesOrderStatus.Completed;
            }
            else
            {
                salesOrder.Status = SalesOrderStatus.PartiallyShipped;
            }

            _unitOfWork.SalesOrders.Update(salesOrder);
            
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();
            await _auditLogger.LogAsync("Dispatch", "Shipment", id.ToString(), newValues: ShipmentStatus.Dispatched.ToString());

            try
            {
                await _notificationService.NotifyRoleUsersAsync(
                    "Sales Manager",
                    NotificationType.ShipmentAlert,
                    $"Shipment Dispatched: {salesOrder.OrderNumber}",
                    $"Sales Order {salesOrder.OrderNumber} has been dispatched via {shipment.CourierName} (Tracking: {shipment.TrackingNumber}).",
                    NotificationPriority.Normal,
                    "Shipment", shipment.Id.ToString(),
                    $"/distribution/shipments/{shipment.Id}",
                    $"ship-dispatched-sales-{shipment.Id}"
                );
            }
            catch { /* Non-critical */ }
        }
        catch(Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw new BadRequestException("Dispatch failed: " + ex.Message);
        }
    }

    public async Task DeliverAsync(Guid id, DeliverShipmentDto dto, Guid currentUserId)
    {
        var shipment = await _unitOfWork.Shipments.GetShipmentWithDetailsAsync(id);
        if (shipment == null)
            throw new KeyNotFoundException("Shipment not found.");

        if (shipment.Status != ShipmentStatus.Dispatched)
            throw new BadRequestException("Only Dispatched shipments can be delivered.");

        foreach (var deliveredItem in dto.DeliveredItems)
        {
            var item = shipment.ShipmentItems.FirstOrDefault(i => i.Id == deliveredItem.ShipmentItemId);
            if (item == null)
                throw new BadRequestException($"Shipment Item ID {deliveredItem.ShipmentItemId} not found in this shipment.");

            if (deliveredItem.DeliveredQuantity > item.Quantity)
                throw new BadRequestException($"Delivered quantity {deliveredItem.DeliveredQuantity} cannot exceed shipped quantity {item.Quantity} for Product ID {item.ProductId}.");

            item.DeliveredQuantity = deliveredItem.DeliveredQuantity;
            item.UpdatedBy = currentUserId;
            item.UpdatedAt = DateTime.UtcNow;
        }

        shipment.Status = ShipmentStatus.Delivered;
        shipment.DeliveryDate = DateTime.UtcNow;
        shipment.UpdatedBy = currentUserId;
        shipment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Shipments.Update(shipment);

        var salesOrder = await _unitOfWork.SalesOrders.GetSalesOrderWithDetailsAsync(shipment.SalesOrderId);
        if (salesOrder != null)
        {
            bool allDelivered = salesOrder.SalesOrderItems.All(i => i.ShippedQuantity >= i.Quantity);
            if (allDelivered)
            {
                salesOrder.Status = SalesOrderStatus.Completed;
                salesOrder.UpdatedAt = DateTime.UtcNow;
                salesOrder.UpdatedBy = currentUserId;
                _unitOfWork.SalesOrders.Update(salesOrder);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Deliver", "Shipment", id.ToString(), newValues: ShipmentStatus.Delivered.ToString());

        try
        {
            var soNum = salesOrder?.OrderNumber ?? shipment.TrackingNumber;
            await _notificationService.NotifyRoleUsersAsync(
                "Sales Manager",
                NotificationType.ShipmentAlert,
                $"Delivery Confirmed: {soNum}",
                $"Shipment {shipment.TrackingNumber} for {soNum} has been delivered. Sales Order marked Completed.",
                NotificationPriority.Normal,
                "Shipment", shipment.Id.ToString(),
                $"/sales/orders/{salesOrder?.Id ?? shipment.SalesOrderId}",
                $"ship-delivered-sales-{shipment.Id}"
            );

            await _notificationService.NotifyRoleUsersAsync(
                "Warranty Executive",
                NotificationType.WarrantyAlert,
                $"Warranty Coverage Active: {soNum}",
                $"Shipment {shipment.TrackingNumber} delivered. Customer products are now active under warranty coverage.",
                NotificationPriority.Normal,
                "Shipment", shipment.Id.ToString(),
                $"/warranty",
                $"ship-delivered-warranty-{shipment.Id}"
            );
        }
        catch { /* Non-critical */ }
    }

    public async Task CancelAsync(Guid id, Guid currentUserId)
    {
        var shipment = await _unitOfWork.Shipments.GetByIdAsync(id);
        if (shipment == null)
            throw new KeyNotFoundException("Shipment not found.");

        if (shipment.Status != ShipmentStatus.Pending)
            throw new BadRequestException($"Shipment in {shipment.Status} status cannot be cancelled. Only Pending shipments can be cancelled.");

        shipment.Status = ShipmentStatus.Cancelled;
        shipment.UpdatedBy = currentUserId;
        shipment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Shipments.Update(shipment);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Cancel", "Shipment", id.ToString(), newValues: ShipmentStatus.Cancelled.ToString());
    }

    private static ShipmentDto MapToDto(Shipment shipment)
    {
        return new ShipmentDto
        {
            Id = shipment.Id,
            SalesOrderId = shipment.SalesOrderId,
            TrackingNumber = shipment.TrackingNumber,
            CourierName = shipment.CourierName,
            DispatchDate = shipment.DispatchDate,
            DeliveryDate = shipment.DeliveryDate,
            Status = shipment.Status,
            CreatedAt = shipment.CreatedAt,
            UpdatedAt = shipment.UpdatedAt,
            ShipmentItems = shipment.ShipmentItems != null ? shipment.ShipmentItems.Select(i => new ShipmentItemDto
            {
                Id = i.Id,
                ShipmentId = i.ShipmentId,
                ProductId = i.ProductId,
                ProductName = i.Product != null ? i.Product.Name : null,
                ProductCode = i.Product != null ? i.Product.ProductCode : null,
                Quantity = i.Quantity,
                DeliveredQuantity = i.DeliveredQuantity
            }).ToList() : new List<ShipmentItemDto>()
        };
    }
}
