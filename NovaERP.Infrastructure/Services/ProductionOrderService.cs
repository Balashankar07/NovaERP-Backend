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

    private readonly INotificationService _notificationService;



    public ProductionOrderService(

        IUnitOfWork unitOfWork, 

        IAuditLogger auditLogger, 

        IInventoryMovementService inventoryMovementService,

        INotificationService notificationService)

    {

        _unitOfWork = unitOfWork;

        _auditLogger = auditLogger;

        _inventoryMovementService = inventoryMovementService;

        _notificationService = notificationService;

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

        if (order == null) return null;



        // Propagate BOM requirements if missing (e.g. historical orders created before BOM linking)

        if (order.Requirements == null || !order.Requirements.Any())

        {

            var bom = order.BOMId.HasValue

                ? await _unitOfWork.BOMs.GetByIdAsync(order.BOMId.Value)

                : await _unitOfWork.BOMs.GetActiveByProductIdAsync(order.ProductId);



            if (bom != null && bom.BOMItems != null && bom.BOMItems.Any())

            {

                order.Requirements ??= new List<ProductionOrderRequirement>();

                foreach (var item in bom.BOMItems)

                {

                    var baseQty = item.Quantity * order.PlannedQuantity;

                    var wasteQty = baseQty * (item.WastePercentage / 100);

                    order.Requirements.Add(new ProductionOrderRequirement

                    {

                        Id = Guid.NewGuid(),

                        ProductionOrderId = order.Id,

                        ProductId = item.RawMaterialProductId,

                        Product = item.RawMaterialProduct,

                        UnitId = item.UnitId,

                        Unit = item.Unit,

                        RequiredQuantity = Math.Round(baseQty + wasteQty, 2),

                        ConsumedQuantity = 0

                    });

                }

            }

        }



        return MapToDto(order);

    }



    public async Task<ProductionOrderDto> CreateAsync(CreateProductionOrderDto dto, Guid? currentUserId)

    {

        var plan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(dto.ProductionPlanId);

        if (plan == null)

            throw new KeyNotFoundException($"ProductionPlan {dto.ProductionPlanId} not found");



        if (plan.Status != ProductionPlanStatus.Released)

            throw new BadRequestException("Production Orders can only be created for Released Production Plans.");



        if (dto.PlannedQuantity <= 0 || dto.PlannedQuantity > 100000)

            throw new BadRequestException("Planned quantity must be between 1 and 100,000 units.");



        var existingOrders = await _unitOfWork.ProductionOrders.GetByProductionPlanIdAsync(plan.Id);

        var totalPlanned = existingOrders.Where(x => x.Status != ProductionOrderStatus.Cancelled).Sum(x => x.PlannedQuantity);



        if (dto.PlannedStartDate.HasValue && dto.PlannedEndDate.HasValue && dto.PlannedEndDate.Value < dto.PlannedStartDate.Value)

            throw new BadRequestException("Planned End Date cannot be earlier than Planned Start Date.");



        if (totalPlanned + dto.PlannedQuantity > plan.PlannedQuantity)
        {
            var remaining = Math.Max(0, plan.PlannedQuantity - totalPlanned);
            throw new BadRequestException($"Total Production Order quantities ({totalPlanned + dto.PlannedQuantity}) would exceed Production Plan quantity ({plan.PlannedQuantity}). Existing active orders total {totalPlanned}, leaving {remaining} unit(s) available.");
        }



        // Resolve BOM from plan or active product BOM

        var bomId = plan.BOMId;

        if (!bomId.HasValue)

        {

            var activeBom = await _unitOfWork.BOMs.GetActiveByProductIdAsync(plan.ProductId);

            bomId = activeBom?.Id;

        }



        var order = new ProductionOrder

        {

            ProductionPlanId = dto.ProductionPlanId,

            PlannedQuantity = dto.PlannedQuantity,

            PlannedStartDate = dto.PlannedStartDate.HasValue ? DateTime.SpecifyKind(dto.PlannedStartDate.Value, DateTimeKind.Utc) : null,

            PlannedEndDate = dto.PlannedEndDate.HasValue ? DateTime.SpecifyKind(dto.PlannedEndDate.Value, DateTimeKind.Utc) : null,

            WorkCenter = dto.WorkCenter,

            Supervisor = dto.Supervisor,

            Priority = dto.Priority,

            Remarks = dto.Remarks,

            ProductId = plan.ProductId,

            BOMId = bomId,

            Status = ProductionOrderStatus.Draft,

            ProductionOrderNumber = $"PO-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",

            CreatedBy = currentUserId,

            CreatedAt = DateTime.UtcNow,

            Requirements = plan.Requirements.Any()

                ? plan.Requirements.Select(r => new ProductionOrderRequirement

                {

                    ProductId = r.ProductId,

                    UnitId = r.UnitId,

                    RequiredQuantity = Math.Round((r.RequiredQuantity / plan.PlannedQuantity) * dto.PlannedQuantity, 2),

                    ConsumedQuantity = 0,

                }).ToList()

                : new List<ProductionOrderRequirement>()

        };



        // If plan had no requirements, populate requirements directly from the BOM

        if (!order.Requirements.Any() && bomId.HasValue)

        {

            var bom = await _unitOfWork.BOMs.GetByIdAsync(bomId.Value);

            if (bom != null && bom.BOMItems != null && bom.BOMItems.Any())

            {

                order.Requirements = bom.BOMItems.Select(item =>

                {

                    var baseQty = item.Quantity * dto.PlannedQuantity;

                    var wasteQty = baseQty * (item.WastePercentage / 100);

                    return new ProductionOrderRequirement

                    {

                        ProductId = item.RawMaterialProductId,

                        UnitId = item.UnitId,

                        RequiredQuantity = Math.Round(baseQty + wasteQty, 2),

                        ConsumedQuantity = 0

                    };

                }).ToList();

            }

        }



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



        if (dto.PlannedQuantity <= 0 || dto.PlannedQuantity > 100000)

            throw new BadRequestException("Planned quantity must be between 1 and 100,000 units.");



        if (order.Status == ProductionOrderStatus.Completed || order.Status == ProductionOrderStatus.Cancelled)

            throw new BadRequestException($"Cannot update a {order.Status} Production Order.");



        if (dto.PlannedStartDate.HasValue && dto.PlannedEndDate.HasValue && dto.PlannedEndDate.Value < dto.PlannedStartDate.Value)

            throw new BadRequestException("Planned End Date cannot be earlier than Planned Start Date.");



        if (order.Status != ProductionOrderStatus.Draft && dto.PlannedQuantity != order.PlannedQuantity)

            throw new BadRequestException("Cannot change planned quantity after the order is released.");



        if (dto.PlannedQuantity != order.PlannedQuantity)

        {

            var existingOrders = await _unitOfWork.ProductionOrders.GetByProductionPlanIdAsync(order.ProductionPlanId);

            var plan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(order.ProductionPlanId);

            

            var totalPlannedExcludingCurrent = existingOrders.Where(x => x.Id != order.Id && x.Status != ProductionOrderStatus.Cancelled).Sum(x => x.PlannedQuantity);

            if (totalPlannedExcludingCurrent + dto.PlannedQuantity > plan!.PlannedQuantity)
            {
                var remaining = Math.Max(0, plan.PlannedQuantity - totalPlannedExcludingCurrent);
                throw new BadRequestException($"Total Production Order quantities ({totalPlannedExcludingCurrent + dto.PlannedQuantity}) would exceed Production Plan quantity ({plan.PlannedQuantity}). Other active orders total {totalPlannedExcludingCurrent}, leaving {remaining} unit(s) available for this order.");
            }



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



            // Ensure requirements exist if product has an active BOM

            if (!order.Requirements.Any())

            {

                var bom = order.BOMId.HasValue

                    ? await _unitOfWork.BOMs.GetByIdAsync(order.BOMId.Value)

                    : await _unitOfWork.BOMs.GetActiveByProductIdAsync(order.ProductId);



                if (bom != null && bom.BOMItems != null && bom.BOMItems.Any())

                {

                    order.BOMId = bom.Id;

                    foreach (var item in bom.BOMItems)

                    {

                        var baseQty = item.Quantity * order.PlannedQuantity;

                        var wasteQty = baseQty * (item.WastePercentage / 100);

                        var req = new ProductionOrderRequirement

                        {

                            ProductionOrderId = order.Id,

                            ProductId = item.RawMaterialProductId,

                            UnitId = item.UnitId,

                            RequiredQuantity = Math.Round(baseQty + wasteQty, 2),

                            ConsumedQuantity = 0

                        };

                        order.Requirements.Add(req);

                        await _unitOfWork.ProductionOrderRequirements.AddAsync(req);

                    }

                    await _unitOfWork.SaveChangesAsync();

                }

            }



            // Reserve materials in usable inventory (throws InvalidOperationException if unavailable or short)

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

            var order = await _unitOfWork.ProductionOrders.GetWithRequirementsAsync(id);

            if (order == null)

                throw new KeyNotFoundException($"ProductionOrder {id} not found");



            if (order.Status != ProductionOrderStatus.InProgress)

                throw new BadRequestException("Only InProgress Production Orders can be completed.");



            if (completedQuantity + rejectedQuantity > order.StartedQuantity)

                throw new BadRequestException("Completed + Rejected quantities cannot exceed started quantity.");



            // Verify all required materials have been consumed

            if (order.Requirements.Any())

            {

                var unconsumed = order.Requirements.Where(r => r.ConsumedQuantity < r.RequiredQuantity).ToList();

                if (unconsumed.Any())

                {

                    throw new BadRequestException("Cannot complete Production Order: all required component materials must be consumed first.");

                }

            }



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



            if (completedQuantity > 0)

            {

                var fgWh = await _unitOfWork.Warehouses.GetByCodeAsync("WH-FG")

                           ?? await _unitOfWork.Warehouses.GetDefaultWarehouseAsync();

                if (fgWh == null)

                {

                    var allWh = await _unitOfWork.Warehouses.GetAllAsync();

                    fgWh = allWh.Items?.FirstOrDefault(w => w.IsActive);

                }



                if (fgWh != null)

                {

                    await _inventoryMovementService.ReceiveAsync(

                        order.ProductId,

                        fgWh.Id,

                        null,

                        completedQuantity,

                        InventoryReferenceType.Production,

                        order.Id,

                        $"Production Order Completed: {order.ProductionOrderNumber}",

                        currentUserId

                    );

                }

            }



            await _auditLogger.LogAsync("StatusChange", "ProductionOrder", order.Id.ToString(), oldValues: "InProgress", newValues: "Completed");



            await _unitOfWork.CommitTransactionAsync();



            try

            {

                var prodName = order.Product?.Name ?? "Finished Goods";

                // Sales Manager is notified exclusively from Quality Manager upon quality inspection approval
                if (false)

                await _notificationService.NotifyRoleUsersAsync(

                    "Sales Manager",

                    NotificationType.ProductionAlert,

                    $"Production Completed: {order.ProductionOrderNumber}",

                    $"{completedQuantity} units of {prodName} completed and deposited into WH-FG. Ready for sales order allocation.",

                    NotificationPriority.High,

                    "ProductionOrder", order.Id.ToString(),

                    $"/sales/orders",

                    $"po-completed-sales-{order.Id}"

                );



                await _notificationService.NotifyRoleUsersAsync(

                    "Warehouse Manager",

                    NotificationType.ProductionAlert,

                    $"Finished Goods Received: {order.ProductionOrderNumber}",

                    $"{completedQuantity} units of {prodName} received from Production into WH-FG.",

                    NotificationPriority.Normal,

                    "ProductionOrder", order.Id.ToString(),

                    $"/production/orders/{order.Id}",

                    $"po-completed-wh-{order.Id}"
                );

                await _notificationService.NotifyRoleUsersAsync(
                    "Quality Engineer",
                    NotificationType.QualityAlert,
                    $"Product Finished: {order.ProductionOrderNumber}",
                    $"{completedQuantity} units of {prodName} finished production under Order {order.ProductionOrderNumber}. Quality verification required.",
                    NotificationPriority.High,
                    "ProductionOrder", order.Id.ToString(),
                    $"/quality",
                    $"po-completed-qa-{order.Id}"

                );

            }

            catch { /* Non-critical notification */ }



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

        ProductName = o.Product?.Name,

        BOMId = o.BOMId,

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

            ProductName = r.Product?.Name,

            UnitId = r.UnitId,

            RequiredQuantity = r.RequiredQuantity,

            ConsumedQuantity = r.ConsumedQuantity

        }).ToList() ?? new List<ProductionOrderRequirementDto>()

    };

}

