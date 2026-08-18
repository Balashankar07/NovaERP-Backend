using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.ProductionExecutions.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class ProductionExecutionService : IProductionExecutionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly IInventoryMovementService _inventoryMovementService;

    public ProductionExecutionService(IUnitOfWork unitOfWork, IAuditLogger auditLogger, IInventoryMovementService inventoryMovementService)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _inventoryMovementService = inventoryMovementService;
    }

    public async Task<PagedResult<ProductionExecutionDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var items = await _unitOfWork.ProductionExecutions.GetAllPagedAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        var dtos = items.Items.Select(MapToDto).ToList();

        return new PagedResult<ProductionExecutionDto>
        {
            Items = dtos,
            TotalCount = items.TotalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ProductionExecutionDto?> GetByIdAsync(Guid id)
    {
        var execution = await _unitOfWork.ProductionExecutions.GetByIdAsync(id);
        return execution == null ? null : MapToDto(execution);
    }

    public async Task<ProductionExecutionDto> CreateAsync(CreateProductionExecutionDto dto, Guid? currentUserId)
    {
        var order = await _unitOfWork.ProductionOrders.GetByIdAsync(dto.ProductionOrderId);
        if (order == null)
            throw new KeyNotFoundException($"ProductionOrder {dto.ProductionOrderId} not found");

        if (order.Status != ProductionOrderStatus.Released && order.Status != ProductionOrderStatus.InProgress)
            throw new BadRequestException("Executions can only be created for Released or InProgress Production Orders.");

        var execution = new ProductionExecution
        {
            ProductionOrderId = dto.ProductionOrderId,
            Remarks = dto.Remarks,
            Status = ProductionExecutionStatus.Draft,
            ExecutionNumber = $"PE-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ProductionExecutions.AddAsync(execution);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Create", "ProductionExecution", execution.Id.ToString(), newValues: $"ExecutionNumber: {execution.ExecutionNumber}, OrderId: {execution.ProductionOrderId}");

        return MapToDto(execution);
    }

    public async Task<ProductionExecutionDto> UpdateAsync(Guid id, UpdateProductionExecutionDto dto, Guid? currentUserId)
    {
        var execution = await _unitOfWork.ProductionExecutions.GetByIdAsync(id);
        if (execution == null)
            throw new KeyNotFoundException($"ProductionExecution {id} not found");

        if (execution.Status == ProductionExecutionStatus.Completed || execution.Status == ProductionExecutionStatus.Cancelled)
            throw new BadRequestException($"Cannot update a {execution.Status} execution.");

        execution.Remarks = dto.Remarks;
        execution.UpdatedBy = currentUserId;
        execution.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.ProductionExecutions.Update(execution);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Update", "ProductionExecution", execution.Id.ToString(), newValues: $"Remarks updated");

        return MapToDto(execution);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid? currentUserId)
    {
        var execution = await _unitOfWork.ProductionExecutions.GetByIdAsync(id);
        if (execution == null)
            throw new KeyNotFoundException($"ProductionExecution {id} not found");

        if (execution.Status != ProductionExecutionStatus.Draft)
            throw new BadRequestException("Only Draft executions can be deleted.");

        _unitOfWork.ProductionExecutions.Delete(execution);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Delete", "ProductionExecution", execution.Id.ToString(), oldValues: $"ExecutionNumber: {execution.ExecutionNumber}");

        return true;
    }

    public async Task<ProductionExecutionDto> StartAsync(Guid id, Guid? currentUserId)
    {
        var execution = await _unitOfWork.ProductionExecutions.GetByIdAsync(id);
        if (execution == null)
            throw new KeyNotFoundException($"ProductionExecution {id} not found");

        if (execution.Status != ProductionExecutionStatus.Draft)
            throw new BadRequestException("Only Draft executions can be started.");

        execution.Status = ProductionExecutionStatus.Started;
        execution.StartedAt = DateTime.UtcNow;
        execution.UpdatedBy = currentUserId;
        execution.UpdatedAt = DateTime.UtcNow;
        
        var order = await _unitOfWork.ProductionOrders.GetByIdAsync(execution.ProductionOrderId);
        if (order != null && order.Status == ProductionOrderStatus.Released)
        {
            order.Status = ProductionOrderStatus.InProgress;
            order.ActualStartDate = DateTime.UtcNow;
            _unitOfWork.ProductionOrders.Update(order);
        }

        _unitOfWork.ProductionExecutions.Update(execution);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "ProductionExecution", execution.Id.ToString(), oldValues: "Draft", newValues: "Started");

        return MapToDto(execution);
    }

    public async Task<ProductionExecutionDto> ConsumeMaterialsAsync(Guid id, Guid? currentUserId)
    {
        try 
        {
            var execution = await _unitOfWork.ProductionExecutions.GetByIdAsync(id);
            if (execution == null)
                throw new KeyNotFoundException($"ProductionExecution {id} not found");

            if (execution.Status != ProductionExecutionStatus.Started)
                throw new BadRequestException("Materials can only be consumed for Started executions.");

        var order = await _unitOfWork.ProductionOrders.GetWithRequirementsAsync(execution.ProductionOrderId);
        if (order == null) throw new KeyNotFoundException("Associated Production Order not found");

        var reservations = await _unitOfWork.InventoryReservations.GetActiveByProductionOrderIdAsync(order.Id);

        if (!reservations.Any())
            throw new BadRequestException("No active inventory reservations found for this Production Order.");

        foreach (var reservation in reservations)
        {
            var consumeQty = reservation.QuantityReserved - reservation.QuantityConsumed;
            if (consumeQty <= 0) continue;

            await _inventoryMovementService.IssueAsync(
                reservation.ProductId,
                reservation.WarehouseId,
                reservation.WarehouseLocationId,
                consumeQty,
                InventoryReferenceType.Production,
                execution.Id,
                $"Consumed from reservation for Execution {execution.ExecutionNumber}",
                currentUserId,
                reservation.Id);

            var requirement = order.Requirements.FirstOrDefault(r => r.Id == reservation.ProductionOrderRequirementId);
            
            var consumption = new MaterialConsumption
            {
                ProductionExecutionId = execution.Id,
                ProductId = reservation.ProductId,
                InventoryId = reservation.InventoryId,
                RequiredQuantity = requirement?.RequiredQuantity ?? 0,
                ConsumedQuantity = consumeQty,
                VarianceQuantity = 0,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.MaterialConsumptions.AddAsync(consumption);
            
            if (requirement != null)
            {
                requirement.ConsumedQuantity += consumeQty;
            }
        }

        execution.UpdatedBy = currentUserId;
        execution.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.ProductionExecutions.Update(execution);
        
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Consume", "ProductionExecution", execution.Id.ToString(), newValues: "Materials consumed from reservations");

        return MapToDto(execution);
        } catch (Exception ex) {
            throw new BadRequestException("CONSUME EXCEPTION: " + ex.Message + "\n" + ex.StackTrace);
        }
    }

    public async Task<ProductionExecutionDto> CompleteAsync(Guid id, CompleteProductionExecutionDto dto, Guid? currentUserId)
    {
        var execution = await _unitOfWork.ProductionExecutions.GetByIdAsync(id);
        if (execution == null)
            throw new KeyNotFoundException($"ProductionExecution {id} not found");

        if (execution.Status != ProductionExecutionStatus.Started)
            throw new BadRequestException("Only Started executions can be completed.");

        if (!execution.MaterialConsumptions.Any())
            throw new BadRequestException("Cannot complete execution without consuming materials first.");

        var order = await _unitOfWork.ProductionOrders.GetByIdAsync(execution.ProductionOrderId);
        if (order == null) throw new KeyNotFoundException("Associated Production Order not found");

        execution.ProducedQuantity = dto.ProducedQuantity;
        execution.RejectedQuantity = dto.RejectedQuantity;
        execution.Status = ProductionExecutionStatus.Completed;
        execution.CompletedAt = DateTime.UtcNow;
        execution.UpdatedBy = currentUserId;
        execution.UpdatedAt = DateTime.UtcNow;

        // Increase finished goods inventory
        var warehouse = await _unitOfWork.Warehouses.GetDefaultWarehouseAsync();
        if (warehouse == null)
            throw new BadRequestException("No warehouse found to store finished goods.");

        if (dto.ProducedQuantity > 0)
        {
            await _inventoryMovementService.ReceiveAsync(
                order.ProductId,
                warehouse.Id,
                null,
                dto.ProducedQuantity,
                InventoryReferenceType.Production,
                execution.Id,
                $"Produced from Execution {execution.ExecutionNumber}",
                currentUserId);
        }

        order.CompletedQuantity += dto.ProducedQuantity;
        order.RejectedQuantity += dto.RejectedQuantity;
        order.Status = ProductionOrderStatus.Completed;
        order.ActualEndDate = DateTime.UtcNow;
        _unitOfWork.ProductionOrders.Update(order);

        _unitOfWork.ProductionExecutions.Update(execution);
        
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "ProductionExecution", execution.Id.ToString(), oldValues: "Started", newValues: "Completed");

        return MapToDto(execution);
    }

    public async Task<ProductionExecutionDto> CancelAsync(Guid id, string reason, Guid? currentUserId)
    {
        var execution = await _unitOfWork.ProductionExecutions.GetByIdAsync(id);
        if (execution == null)
            throw new KeyNotFoundException($"ProductionExecution {id} not found");

        if (execution.Status == ProductionExecutionStatus.Completed || execution.Status == ProductionExecutionStatus.Cancelled)
            throw new BadRequestException($"Cannot cancel a {execution.Status} execution.");

        execution.Status = ProductionExecutionStatus.Cancelled;
        execution.Remarks = string.IsNullOrWhiteSpace(execution.Remarks) ? reason : $"{execution.Remarks} | Cancelled: {reason}";
        execution.UpdatedBy = currentUserId;
        execution.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.ProductionExecutions.Update(execution);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "ProductionExecution", execution.Id.ToString(), oldValues: execution.Status.ToString(), newValues: "Cancelled");

        return MapToDto(execution);
    }

    private static ProductionExecutionDto MapToDto(ProductionExecution e) => new()
    {
        Id = e.Id,
        ExecutionNumber = e.ExecutionNumber,
        ProductionOrderId = e.ProductionOrderId,
        StartedAt = e.StartedAt,
        CompletedAt = e.CompletedAt,
        ProducedQuantity = e.ProducedQuantity,
        RejectedQuantity = e.RejectedQuantity,
        Status = e.Status,
        Remarks = e.Remarks,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
        CreatedBy = e.CreatedBy
    };
}
