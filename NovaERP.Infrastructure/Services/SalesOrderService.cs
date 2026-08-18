using NovaERP.Application.Common.Models;
using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.DTOs.Sales;
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

    public SalesOrderService(IUnitOfWork unitOfWork, IAuditLogger auditLogger, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _currentUserService = currentUserService;
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
        if (order == null)
            throw new KeyNotFoundException(nameof(SalesOrder) + " not found");

        return MapToDto(order);
    }

    public async Task<SalesOrderDto> CreateAsync(CreateSalesOrderDto dto, Guid? currentUserId)
    {
        var distributor = await _unitOfWork.Distributors.GetByIdAsync(dto.DistributorId);
        if (distributor == null || !distributor.IsActive)
            throw new BadRequestException("Active Distributor is required.");

        if (dto.Items == null || !dto.Items.Any())
            throw new BadRequestException("At least one item is required in the sales order.");

        var order = new SalesOrder
        {
            OrderNumber = await _unitOfWork.SalesOrders.GenerateOrderNumberAsync(),
            DistributorId = dto.DistributorId,
            OrderDate = DateTime.UtcNow,
            Status = SalesOrderStatus.Draft,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow,
            TotalAmount = 0
        };

        foreach (var itemDto in dto.Items)
        {
            if (itemDto.Quantity <= 0)
                throw new BadRequestException($"Quantity for product {itemDto.ProductId} must be greater than zero.");
            
            if (itemDto.UnitPrice < 0)
                throw new BadRequestException($"Unit price for product {itemDto.ProductId} cannot be negative.");

            var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId);
            if (product == null || !product.IsActive)
                throw new BadRequestException($"Active Product with ID {itemDto.ProductId} is required.");

            var item = new SalesOrderItem
            {
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                TotalPrice = itemDto.Quantity * itemDto.UnitPrice,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            order.SalesOrderItems.Add(item);
            order.TotalAmount += item.TotalPrice;
        }

        await _unitOfWork.SalesOrders.AddAsync(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Create", "SalesOrder", order.Id.ToString(), newValues: order.OrderNumber);

        return await GetSalesOrderByIdAsync(order.Id);
    }

    public async Task<SalesOrderDto> UpdateAsync(Guid id, UpdateSalesOrderDto dto, Guid? currentUserId)
    {
        bool isDistributor = _currentUserService.Role?.Contains("Distributor", StringComparison.OrdinalIgnoreCase) ?? false;
        var order = await _unitOfWork.SalesOrders.GetSalesOrderWithDetailsAsync(id, currentUserId, isDistributor);
        if (order == null)
            throw new KeyNotFoundException(nameof(SalesOrder) + " not found");

        if (order.Status != SalesOrderStatus.Draft)
            throw new BadRequestException("Only Draft orders can be updated.");

        var distributor = await _unitOfWork.Distributors.GetByIdAsync(dto.DistributorId);
        if (distributor == null || !distributor.IsActive)
            throw new BadRequestException("Active Distributor is required.");

        if (dto.Items == null || !dto.Items.Any())
            throw new BadRequestException("At least one item is required in the sales order.");

        order.DistributorId = dto.DistributorId;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        // Simplify by clearing and re-adding items
        order.SalesOrderItems.Clear();
        order.TotalAmount = 0;

        foreach (var itemDto in dto.Items)
        {
            if (itemDto.Quantity <= 0)
                throw new BadRequestException($"Quantity for product {itemDto.ProductId} must be greater than zero.");
            
            if (itemDto.UnitPrice < 0)
                throw new BadRequestException($"Unit price for product {itemDto.ProductId} cannot be negative.");

            var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId);
            if (product == null || !product.IsActive)
                throw new BadRequestException($"Active Product with ID {itemDto.ProductId} is required.");

            var item = new SalesOrderItem
            {
                SalesOrderId = order.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                TotalPrice = itemDto.Quantity * itemDto.UnitPrice,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            order.SalesOrderItems.Add(item);
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
        if (order == null)
            throw new KeyNotFoundException(nameof(SalesOrder) + " not found");

        if (order.Status != SalesOrderStatus.Draft)
            throw new BadRequestException("Only Draft orders can be deleted.");

        _unitOfWork.SalesOrders.Delete(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Delete", "SalesOrder", id.ToString());
    }

    public async Task<SalesOrderDto> SubmitAsync(Guid id, Guid? currentUserId)
    {
        var order = await _unitOfWork.SalesOrders.GetByIdAsync(id);
        if (order == null)
            throw new KeyNotFoundException(nameof(SalesOrder) + " not found");

        if (order.Status != SalesOrderStatus.Draft)
            throw new BadRequestException("Only Draft orders can be submitted.");

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
        if (order == null)
            throw new KeyNotFoundException(nameof(SalesOrder) + " not found");

        if (order.Status != SalesOrderStatus.PendingApproval)
            throw new BadRequestException("Only PendingApproval orders can be approved.");

        order.Status = SalesOrderStatus.Approved;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.SalesOrders.Update(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Approve", "SalesOrder", id.ToString(), oldValues: SalesOrderStatus.PendingApproval.ToString(), newValues: SalesOrderStatus.Approved.ToString());

        return await GetSalesOrderByIdAsync(order.Id);
    }

    public async Task<SalesOrderDto> CancelAsync(Guid id, string reason, Guid? currentUserId)
    {
        var order = await _unitOfWork.SalesOrders.GetByIdAsync(id);
        if (order == null)
            throw new KeyNotFoundException(nameof(SalesOrder) + " not found");

        if (order.Status == SalesOrderStatus.Approved || order.Status == SalesOrderStatus.Cancelled)
            throw new BadRequestException("Approved or Cancelled orders cannot be cancelled.");

        var oldStatus = order.Status.ToString();
        order.Status = SalesOrderStatus.Cancelled;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.SalesOrders.Update(order);
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
            Status = entity.Status,
            TotalAmount = entity.TotalAmount,
            Items = entity.SalesOrderItems.Select(i => new SalesOrderItemDto
            {
                Id = i.Id,
                SalesOrderId = i.SalesOrderId,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice
            }).ToList()
        };
    }
}
