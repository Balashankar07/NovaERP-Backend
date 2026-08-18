using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.ProductionOrders.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class ProductionOrderService : IProductionOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly IInventoryMovementService _inventoryMovementService;

    public ProductionOrderService(IUnitOfWork unitOfWork, IAuditLogger auditLogger, IInventoryMovementService inventoryMovementService)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _inventoryMovementService = inventoryMovementService;
    }

    public async Task<PagedResult<ProductionOrderDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var items = await _unitOfWork.ProductionOrders.GetAllPagedAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        var dtos = items.Items.Select(MapToDto).ToList();

        return new PagedResult<ProductionOrderDto>
        {
            Items = dtos,
            TotalCount = items.TotalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ProductionOrderDto?> GetByIdAsync(Guid id)
    {
        var order = await _unitOfWork.ProductionOrders.GetWithRequirementsAsync(id);
        return order == null ? null : MapToDto(order);
    }

    public async Task<ProductionOrderDto> CreateAsync(CreateProductionOrderDto dto, Guid? currentUserId)
    {
        var plan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(dto.ProductionPlanId);
        if (plan == null)
            throw new KeyNotFoundException($"ProductionPlan {dto.ProductionPlanId} not found");

        if (plan.Status != ProductionPlanStatus.Released)
            throw new BadRequestException("Production Orders can only be created for Released Production Plans.");

        var existingOrders = await _unitOfWork.ProductionOrders.GetByProductionPlanIdAsync(plan.Id);
        var totalPlanned = existingOrders.Sum(x => x.PlannedQuantity);

        if (totalPlanned + dto.PlannedQuantity > plan.PlannedQuantity)
            throw new BadRequestException($"Total Production Order quantities ({totalPlanned + dto.PlannedQuantity}) cannot exceed Production Plan quantity ({plan.PlannedQuantity}).");

        var order = new ProductionOrder
        {
            ProductionPlanId = dto.ProductionPlanId,
            PlannedQuantity = dto.PlannedQuantity,
            PlannedStartDate = dto.PlannedStartDate,
            PlannedEndDate = dto.PlannedEndDate,
            WorkCenter = dto.WorkCenter,
            Supervisor = dto.Supervisor,
            Priority = dto.Priority,
            Remarks = dto.Remarks,
            ProductId = plan.ProductId,
            Status = ProductionOrderStatus.Draft,
            ProductionOrderNumber = $"PO-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow,
            Requirements = plan.Requirements.Select(r => new ProductionOrderRequirement
            {
                ProductId = r.ProductId,
                UnitId = r.UnitId,
                RequiredQuantity = Math.Round((r.RequiredQuantity / plan.PlannedQuantity) * dto.PlannedQuantity, 2),
                ConsumedQuantity = 0,
            }).ToList()
        };

        await _unitOfWork.ProductionOrders.AddAsync(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Create", "ProductionOrder", order.Id.ToString(), newValues: $"OrderNumber: {order.ProductionOrderNumber}, PlanId: {order.ProductionPlanId}, Quantity: {order.PlannedQuantity}");

        return MapToDto(order);
    }

    public async Task<ProductionOrderDto> UpdateAsync(Guid id, UpdateProductionOrderDto dto, Guid? currentUserId)
    {
        var order = await _unitOfWork.ProductionOrders.GetWithRequirementsAsync(id);
        if (order == null)
            throw new KeyNotFoundException($"ProductionOrder {id} not found");

        if (order.Status == ProductionOrderStatus.Completed || order.Status == ProductionOrderStatus.Cancelled)
            throw new BadRequestException($"Cannot update a {order.Status} Production Order.");

        if (order.Status != ProductionOrderStatus.Draft && dto.PlannedQuantity != order.PlannedQuantity)
            throw new BadRequestException("Cannot change planned quantity after the order is released.");

        if (dto.PlannedQuantity != order.PlannedQuantity)
        {
            var existingOrders = await _unitOfWork.ProductionOrders.GetByProductionPlanIdAsync(order.ProductionPlanId);
            var plan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(order.ProductionPlanId);
            
            var totalPlannedExcludingCurrent = existingOrders.Where(x => x.Id != order.Id).Sum(x => x.PlannedQuantity);
            if (totalPlannedExcludingCurrent + dto.PlannedQuantity > plan!.PlannedQuantity)
                throw new BadRequestException($"Total Production Order quantities cannot exceed Production Plan quantity.");

            // Recalculate requirements based on the new quantity
            foreach (var req in order.Requirements)
            {
                var planReq = plan.Requirements.FirstOrDefault(r => r.ProductId == req.ProductId);
                if (planReq != null)
                {
                    req.RequiredQuantity = Math.Round((planReq.RequiredQuantity / plan.PlannedQuantity) * dto.PlannedQuantity, 2);
                }
            }
        }

        order.PlannedQuantity = dto.PlannedQuantity;
        order.PlannedStartDate = dto.PlannedStartDate;
        order.PlannedEndDate = dto.PlannedEndDate;
        order.WorkCenter = dto.WorkCenter;
        order.Supervisor = dto.Supervisor;
        order.Priority = dto.Priority;
        order.Remarks = dto.Remarks;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.ProductionOrders.Update(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Update", "ProductionOrder", order.Id.ToString(), newValues: $"PlannedQuantity: {order.PlannedQuantity}");

        return MapToDto(order);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid? currentUserId)
    {
        var order = await _unitOfWork.ProductionOrders.GetByIdAsync(id);
        if (order == null)
            throw new KeyNotFoundException($"ProductionOrder {id} not found");

        if (order.Status != ProductionOrderStatus.Draft)
            throw new BadRequestException("Only Draft Production Orders can be deleted.");

        _unitOfWork.ProductionOrders.Delete(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Delete", "ProductionOrder", order.Id.ToString(), oldValues: $"OrderNumber: {order.ProductionOrderNumber}");

        return true;
    }

    public async Task<ProductionOrderDto> ReleaseAsync(Guid id, Guid? currentUserId)
    {
        await _unitOfWork.BeginTransactionAsync();
        try 
        {
            var order = await _unitOfWork.ProductionOrders.GetWithRequirementsAsync(id);
            if (order == null)
                throw new KeyNotFoundException($"ProductionOrder {id} not found");

            if (order.Status != ProductionOrderStatus.Draft)
                throw new BadRequestException("Only Draft Production Orders can be released.");

            // Reserve materials
            foreach (var req in order.Requirements)
            {
                await _inventoryMovementService.ReserveForRequirementAsync(order.Id, req.Id, req.ProductId, req.RequiredQuantity, currentUserId);
            }

            order.Status = ProductionOrderStatus.Released;
            order.UpdatedBy = currentUserId;
            order.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.ProductionOrders.Update(order);
            await _unitOfWork.SaveChangesAsync();
            await _auditLogger.LogAsync("StatusChange", "ProductionOrder", order.Id.ToString(), oldValues: "Draft", newValues: "Released");

            await _unitOfWork.CommitTransactionAsync();
            return MapToDto(order);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<ProductionOrderDto> StartAsync(Guid id, decimal startedQuantity, Guid? currentUserId)
    {
        var order = await _unitOfWork.ProductionOrders.GetByIdAsync(id);
        if (order == null)
            throw new KeyNotFoundException($"ProductionOrder {id} not found");

        if (order.Status != ProductionOrderStatus.Released)
            throw new BadRequestException("Only Released Production Orders can be started.");

        if (startedQuantity <= 0)
            throw new BadRequestException("Started quantity must be greater than zero.");
            
        if (startedQuantity > order.PlannedQuantity)
            throw new BadRequestException("Started quantity cannot exceed planned quantity.");

        order.Status = ProductionOrderStatus.InProgress;
        order.StartedQuantity = startedQuantity;
        order.ActualStartDate = DateTime.UtcNow;
        order.UpdatedBy = currentUserId;
        order.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.ProductionOrders.Update(order);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "ProductionOrder", order.Id.ToString(), oldValues: "Released", newValues: "InProgress");

        return MapToDto(order);
    }

    public async Task<ProductionOrderDto> CompleteAsync(Guid id, decimal completedQuantity, decimal rejectedQuantity, Guid? currentUserId)
    {
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var order = await _unitOfWork.ProductionOrders.GetByIdAsync(id);
            if (order == null)
                throw new KeyNotFoundException($"ProductionOrder {id} not found");

            if (order.Status != ProductionOrderStatus.InProgress)
                throw new BadRequestException("Only InProgress Production Orders can be completed.");

            if (completedQuantity + rejectedQuantity > order.StartedQuantity)
                throw new BadRequestException("Completed + Rejected quantities cannot exceed started quantity.");

            // Release unused reservations
            await _inventoryMovementService.ReleaseUnusedReservationsAsync(order.Id, currentUserId);

            order.Status = ProductionOrderStatus.Completed;
            order.CompletedQuantity = completedQuantity;
            order.RejectedQuantity = rejectedQuantity;
            order.ActualEndDate = DateTime.UtcNow;
            order.UpdatedBy = currentUserId;
            order.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.ProductionOrders.Update(order);
            await _unitOfWork.SaveChangesAsync();
            await _auditLogger.LogAsync("StatusChange", "ProductionOrder", order.Id.ToString(), oldValues: "InProgress", newValues: "Completed");

            await _unitOfWork.CommitTransactionAsync();
            return MapToDto(order);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<ProductionOrderDto> CancelAsync(Guid id, string reason, Guid? currentUserId)
    {
        await _unitOfWork.BeginTransactionAsync();
        try 
        {
            var order = await _unitOfWork.ProductionOrders.GetByIdAsync(id);
            if (order == null)
                throw new KeyNotFoundException($"ProductionOrder {id} not found");

            if (order.Status == ProductionOrderStatus.Completed || order.Status == ProductionOrderStatus.Cancelled)
                throw new BadRequestException($"Cannot cancel a {order.Status} Production Order.");

            // Release unused reservations
            await _inventoryMovementService.ReleaseUnusedReservationsAsync(order.Id, currentUserId);

            order.Status = ProductionOrderStatus.Cancelled;
            order.Remarks = string.IsNullOrWhiteSpace(order.Remarks) ? reason : $"{order.Remarks} | Cancelled: {reason}";
            order.UpdatedBy = currentUserId;
            order.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.ProductionOrders.Update(order);
            await _unitOfWork.SaveChangesAsync();
            await _auditLogger.LogAsync("StatusChange", "ProductionOrder", order.Id.ToString(), oldValues: order.Status.ToString(), newValues: "Cancelled");

            await _unitOfWork.CommitTransactionAsync();
            return MapToDto(order);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    private static ProductionOrderDto MapToDto(ProductionOrder o) => new()
    {
        Id = o.Id,
        ProductionOrderNumber = o.ProductionOrderNumber,
        ProductionPlanId = o.ProductionPlanId,
        ProductId = o.ProductId,
        PlannedQuantity = o.PlannedQuantity,
        StartedQuantity = o.StartedQuantity,
        CompletedQuantity = o.CompletedQuantity,
        RejectedQuantity = o.RejectedQuantity,
        PlannedStartDate = o.PlannedStartDate,
        PlannedEndDate = o.PlannedEndDate,
        ActualStartDate = o.ActualStartDate,
        ActualEndDate = o.ActualEndDate,
        WorkCenter = o.WorkCenter,
        Supervisor = o.Supervisor,
        Priority = o.Priority,
        Status = o.Status,
        Remarks = o.Remarks,
        CreatedAt = o.CreatedAt,
        UpdatedAt = o.UpdatedAt,
        CreatedBy = o.CreatedBy,
        Materials = o.Requirements?.Select(r => new ProductionOrderRequirementDto
        {
            Id = r.Id,
            ProductionOrderId = r.ProductionOrderId,
            ProductId = r.ProductId,
            UnitId = r.UnitId,
            RequiredQuantity = r.RequiredQuantity,
            ConsumedQuantity = r.ConsumedQuantity
        }).ToList() ?? new List<ProductionOrderRequirementDto>()
    };
}
