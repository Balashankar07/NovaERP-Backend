using NovaERP.Application.Common.Models;
using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.DTOs.Sales;
using NovaERP.Application.DTOs.Notifications;
using NovaERP.Application.Interfaces;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class SalesOrderService : ISalesOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IInventoryMovementService _inventoryMovementService;
    private readonly INotificationService _notificationService;

    public SalesOrderService(IUnitOfWork unitOfWork, IAuditLogger auditLogger, ICurrentUserService currentUserService, IInventoryMovementService inventoryMovementService, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _currentUserService = currentUserService;
        _inventoryMovementService = inventoryMovementService;
        _notificationService = notificationService;
    }

    public async Task<PagedResult<SalesOrderDto>> GetSalesOrdersAsync(int pageNumber, int pageSize, string? search, string? sortBy, string? sortOrder)
    {
        bool isDistributor = _currentUserService.Role?.Contains("Distributor", StringComparison.OrdinalIgnoreCase) ?? false;
        var result = await _unitOfWork.SalesOrders.GetSalesOrdersPagedAsync(pageNumber, pageSize, search, sortBy, sortOrder, _currentUserService.UserId, isDistributor);
        var dtos = result.Items.Select(MapToDto).ToList();
        return new PagedResult<SalesOrderDto> { Items = dtos, TotalCount = result.TotalCount, PageNumber = result.PageNumber, PageSize = result.PageSize };
    }

    public async Task<SalesOrderDto> GetSalesOrderByIdAsync(Guid id)
    {
        bool isDistributor = _currentUserService.Role?.Contains("Distributor", StringComparison.OrdinalIgnoreCase) ?? false;
        var order = await _unitOfWork.SalesOrders.GetSalesOrderWithDetailsAsync(id, _currentUserService.UserId, isDistributor);
        if (order == null) throw new KeyNotFoundException(nameof(SalesOrder) + " not found");
        return MapToDto(order);
    }

    public async Task<SalesOrderDto> CreateAsync(CreateSalesOrderDto dto, Guid? currentUserId)
    {
        var distributor = await _unitOfWork.Distributors.GetByIdAsync(dto.DistributorId);
        if (distributor == null || !distributor.IsActive) throw new BadRequestException("Active Distributor is required.");
        if (dto.Items == null || !dto.Items.Any()) throw new BadRequestException("At least one item is required in the sales order.");

        var order = new SalesOrder
        {
            OrderNumber = await _unitOfWork.SalesOrders.GenerateOrderNumberAsync(),
            DistributorId = dto.DistributorId,
            OrderDate = DateTime.UtcNow,
            RequiredDeliveryDate = dto.RequiredDeliveryDate,
            Currency = dto.Currency ?? "USD",
            ShippingAddress = dto.ShippingAddress,
            BillingAddress = dto.BillingAddress,
            Remarks = dto.Remarks,
            Status = SalesOrderStatus.Draft,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow,
            Subtotal = 0,
            DiscountAmount = 0,
            TaxAmount = 0,
            TotalAmount = 0
        };

        foreach (var itemDto in dto.Items)
        {
            if (itemDto.Quantity <= 0) throw new BadRequestException($"Quantity for product {itemDto.ProductId} must be greater than zero.");
            if (itemDto.UnitPrice < 0) throw new BadRequestException($"Unit price for product {itemDto.ProductId} cannot be negative.");
            
            var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId);
            if (product == null || !product.IsActive) throw new BadRequestException($"Active Product with ID {itemDto.ProductId} is required.");
            if (product.Type != ProductType.FinishedGood) throw new BadRequestException($"Only FinishedGoods can be sold. Product {product.Name} is a {product.Type}.");

            var item = new SalesOrderItem
            {
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                Unit = itemDto.Unit ?? "ea",
                UnitPrice = itemDto.UnitPrice,
                Discount = itemDto.Discount,
                Tax = itemDto.Tax,
                TotalPrice = (itemDto.Quantity * itemDto.UnitPrice) - itemDto.Discount + itemDto.Tax,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            order.SalesOrderItems.Add(item);
            order.Subtotal += (item.Quantity * item.UnitPrice);
            order.DiscountAmount += item.Discount;
            order.TaxAmount += item.Tax;
            order.TotalAmount += item.TotalPrice;
        }

        await _unitOfWork.SalesOrders.AddAsync(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Create", "SalesOrder", order.Id.ToString(), newValues: order.OrderNumber);

        // Notify Sales Manager and Production Manager about new sales order
        try
        {
            await _notificationService.NotifyRoleUsersAsync(
                "Sales Manager",
                NotificationType.StatusChange,
                $"New Sales Order {order.OrderNumber}",
                $"A new sales order {order.OrderNumber} has been created and is in draft.",
                NotificationPriority.Normal,
                "SalesOrder", order.Id.ToString(),
                $"/sales/orders",
                $"so-created-{order.Id}"
            );

            await _notificationService.NotifyRoleUsersAsync(
                "Production Manager",
                NotificationType.ProductionAlert,
                $"Sales Order Intake: {order.OrderNumber}",
                $"New Sales Order {order.OrderNumber} created with {order.SalesOrderItems.Count} item(s). Review inventory availability and production capacity.",
                NotificationPriority.Normal,
                "SalesOrder", order.Id.ToString(),
                $"/production",
                $"so-created-prod-{order.Id}"
            );
        }
        catch { /* Non-critical */ }

        return await GetSalesOrderByIdAsync(order.Id);
    }

    public async Task<SalesOrderDto> UpdateAsync(Guid id, UpdateSalesOrderDto dto, Guid? currentUserId)
    {
        bool isDistributor = _currentUserService.Role?.Contains("Distributor", StringComparison.OrdinalIgnoreCase) ?? false;
        var order = await _unitOfWork.SalesOrders.GetSalesOrderWithDetailsAsync(id, currentUserId, isDistributor);
        if (order == null) throw new KeyNotFoundException(nameof(SalesOrder) + " not found");
        if (order.Status != SalesOrderStatus.Draft) throw new BadRequestException("Only Draft orders can be updated.");

        var distributor = await _unitOfWork.Distributors.GetByIdAsync(dto.DistributorId);
        if (distributor == null || !distributor.IsActive) throw new BadRequestException("Active Distributor is required.");
        if (dto.Items == null || !dto.Items.Any()) throw new BadRequestException("At least one item is required in the sales order.");

        order.DistributorId = dto.DistributorId;
        order.RequiredDeliveryDate = dto.RequiredDeliveryDate;
        order.Currency = dto.Currency ?? "USD";
        order.ShippingAddress = dto.ShippingAddress;
        order.BillingAddress = dto.BillingAddress;
        order.Remarks = dto.Remarks;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        order.SalesOrderItems.Clear();
        order.Subtotal = 0;
        order.DiscountAmount = 0;
        order.TaxAmount = 0;
        order.TotalAmount = 0;

        foreach (var itemDto in dto.Items)
        {
            if (itemDto.Quantity <= 0) throw new BadRequestException($"Quantity for product {itemDto.ProductId} must be greater than zero.");
            if (itemDto.UnitPrice < 0) throw new BadRequestException($"Unit price for product {itemDto.ProductId} cannot be negative.");

            var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId);
            if (product == null || !product.IsActive) throw new BadRequestException($"Active Product with ID {itemDto.ProductId} is required.");
            if (product.Type != ProductType.FinishedGood) throw new BadRequestException($"Only FinishedGoods can be sold. Product {product.Name} is a {product.Type}.");

            var item = new SalesOrderItem
            {
                SalesOrderId = order.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                Unit = itemDto.Unit ?? "ea",
                UnitPrice = itemDto.UnitPrice,
                Discount = itemDto.Discount,
                Tax = itemDto.Tax,
                TotalPrice = (itemDto.Quantity * itemDto.UnitPrice) - itemDto.Discount + itemDto.Tax,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            order.SalesOrderItems.Add(item);
            order.Subtotal += (item.Quantity * item.UnitPrice);
            order.DiscountAmount += item.Discount;
            order.TaxAmount += item.Tax;
            order.TotalAmount += item.TotalPrice;
        }

        _unitOfWork.SalesOrders.Update(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Update", "SalesOrder", order.Id.ToString());

        return await GetSalesOrderByIdAsync(order.Id);
    }

    public async Task DeleteAsync(Guid id, Guid? currentUserId)
    {
        var order = await _unitOfWork.SalesOrders.GetByIdAsync(id);
        if (order == null) throw new KeyNotFoundException(nameof(SalesOrder) + " not found");
        if (order.Status != SalesOrderStatus.Draft) throw new BadRequestException("Only Draft orders can be deleted.");

        _unitOfWork.SalesOrders.Delete(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Delete", "SalesOrder", id.ToString());
    }

    public async Task<SalesOrderDto> SubmitAsync(Guid id, Guid? currentUserId)
    {
        var order = await _unitOfWork.SalesOrders.GetByIdAsync(id);
        if (order == null) throw new KeyNotFoundException(nameof(SalesOrder) + " not found");
        if (order.Status != SalesOrderStatus.Draft) throw new BadRequestException("Only Draft orders can be submitted.");

        order.Status = SalesOrderStatus.PendingApproval;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.SalesOrders.Update(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "SalesOrder", id.ToString(), oldValues: SalesOrderStatus.Draft.ToString(), newValues: SalesOrderStatus.PendingApproval.ToString());

        return await GetSalesOrderByIdAsync(order.Id);
    }

    public async Task<SalesOrderDto> ApproveAsync(Guid id, Guid? currentUserId)
    {
        var order = await _unitOfWork.SalesOrders.GetByIdAsync(id);
        if (order == null) throw new KeyNotFoundException(nameof(SalesOrder) + " not found");
        if (order.Status != SalesOrderStatus.PendingApproval) throw new BadRequestException("Only PendingApproval orders can be approved.");

        order.Status = SalesOrderStatus.Approved;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.SalesOrders.Update(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Approve", "SalesOrder", id.ToString(), oldValues: SalesOrderStatus.PendingApproval.ToString(), newValues: SalesOrderStatus.Approved.ToString());

        // Notify Warehouse Manager and Production Manager about approved sales order
        try
        {
            await _notificationService.NotifyRoleUsersAsync(
                "Warehouse Manager",
                NotificationType.ShipmentAlert,
                $"Sales Order Approved — Ready for Fulfillment",
                $"Sales Order {order.OrderNumber} has been approved and requires warehouse fulfillment.",
                NotificationPriority.High,
                "SalesOrder", id.ToString(),
                $"/sales/orders",
                $"so-approved-warehouse-{id}"
            );

            await _notificationService.NotifyRoleUsersAsync(
                "Production Manager",
                NotificationType.ProductionAlert,
                $"Sales Order Demand: {order.OrderNumber}",
                $"Sales Order {order.OrderNumber} has been approved. Check component readiness and release manufacturing plan if stock is short.",
                NotificationPriority.High,
                "SalesOrder", id.ToString(),
                $"/production",
                $"so-approved-prod-{id}"
            );
        }
        catch { /* Non-critical */ }

        return await GetSalesOrderByIdAsync(order.Id);
    }

    public async Task<SalesOrderDto> RejectAsync(Guid id, Guid? currentUserId)
    {
        var order = await _unitOfWork.SalesOrders.GetByIdAsync(id);
        if (order == null) throw new KeyNotFoundException(nameof(SalesOrder) + " not found");
        if (order.Status != SalesOrderStatus.PendingApproval) throw new BadRequestException("Only PendingApproval orders can be rejected.");

        order.Status = SalesOrderStatus.Rejected;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.SalesOrders.Update(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Reject", "SalesOrder", id.ToString(), oldValues: SalesOrderStatus.PendingApproval.ToString(), newValues: SalesOrderStatus.Rejected.ToString());

        return await GetSalesOrderByIdAsync(order.Id);
    }

    public async Task<SalesOrderDto> ReserveAsync(Guid id, Guid? currentUserId)
    {
        var order = await _unitOfWork.SalesOrders.GetSalesOrderWithDetailsAsync(id, currentUserId, false);
        if (order == null) throw new KeyNotFoundException(nameof(SalesOrder) + " not found");
        if (order.Status != SalesOrderStatus.Approved) throw new BadRequestException("Only Approved orders can be reserved.");

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            foreach (var item in order.SalesOrderItems)
            {
                // Reservation must be atomic across the whole order.
                await _inventoryMovementService.ReserveForSalesOrderItemAsync(order.Id, item.Id, item.ProductId, item.Quantity, currentUserId);
                item.ReservedQuantity = item.Quantity;
            }

            order.Status = SalesOrderStatus.Reserved;
            order.UpdatedBy = currentUserId;
            order.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.SalesOrders.Update(order);
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();
            
            await _auditLogger.LogAsync("Reserve", "SalesOrder", id.ToString(), oldValues: SalesOrderStatus.Approved.ToString(), newValues: SalesOrderStatus.Reserved.ToString());
        }
        catch(InvalidOperationException ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw new ConflictException("Reservation conflict: " + ex.Message);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }

        return await GetSalesOrderByIdAsync(order.Id);
    }

    public async Task<SalesOrderDto> CancelAsync(Guid id, string reason, Guid? currentUserId)
    {
        var order = await _unitOfWork.SalesOrders.GetSalesOrderWithDetailsAsync(id, currentUserId, false);
        if (order == null) throw new KeyNotFoundException(nameof(SalesOrder) + " not found");
        
        if (order.Status == SalesOrderStatus.Completed || order.Status == SalesOrderStatus.Cancelled || order.Status == SalesOrderStatus.PartiallyShipped)
            throw new BadRequestException("Order cannot be cancelled in its current state.");

        var oldStatus = order.Status.ToString();
        order.Status = SalesOrderStatus.Cancelled;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.SalesOrders.Update(order);

        // If reserved, release reservations safely.
        if (oldStatus == SalesOrderStatus.Reserved.ToString() || oldStatus == SalesOrderStatus.ReadyToShip.ToString())
        {
            await _inventoryMovementService.ReleaseUnusedSalesReservationsAsync(order.Id, currentUserId);
            foreach(var item in order.SalesOrderItems)
            {
                item.ReservedQuantity = 0;
            }
        }

        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Cancel", "SalesOrder", id.ToString(), oldValues: oldStatus, newValues: SalesOrderStatus.Cancelled.ToString());

        return await GetSalesOrderByIdAsync(order.Id);
    }

    private SalesOrderDto MapToDto(SalesOrder entity)
    {
        return new SalesOrderDto
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            DistributorId = entity.DistributorId,
            DistributorName = entity.Distributor?.CompanyName ?? string.Empty,
            OrderDate = entity.OrderDate,
            RequiredDeliveryDate = entity.RequiredDeliveryDate,
            Currency = entity.Currency,
            Subtotal = entity.Subtotal,
            DiscountAmount = entity.DiscountAmount,
            TaxAmount = entity.TaxAmount,
            TotalAmount = entity.TotalAmount,
            ShippingAddress = entity.ShippingAddress,
            BillingAddress = entity.BillingAddress,
            Remarks = entity.Remarks,
            Status = entity.Status,
            Items = entity.SalesOrderItems.Select(i => new SalesOrderItemDto
            {
                Id = i.Id,
                SalesOrderId = i.SalesOrderId,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? string.Empty,
                Quantity = i.Quantity,
                Unit = i.Unit,
                UnitPrice = i.UnitPrice,
                Discount = i.Discount,
                Tax = i.Tax,
                TotalPrice = i.TotalPrice,
                ReservedQuantity = i.ReservedQuantity,
                ShippedQuantity = i.ShippedQuantity
            }).ToList()
        };
    }
}
