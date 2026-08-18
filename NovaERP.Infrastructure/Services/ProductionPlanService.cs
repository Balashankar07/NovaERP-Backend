using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.ProductionPlans.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class ProductionPlanService : IProductionPlanService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;

    public ProductionPlanService(IUnitOfWork unitOfWork, IAuditLogger auditLogger)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
    }

    public async Task<PagedResult<ProductionPlanDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var result = await _unitOfWork.ProductionPlans.GetAllPagedAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return new PagedResult<ProductionPlanDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize
        };
    }

    public async Task<ProductionPlanDto?> GetByIdAsync(Guid id)
    {
        var plan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(id);
        return plan == null ? null : MapToDto(plan);
    }

    public async Task<ProductionPlanDto> CreateAsync(CreateProductionPlanDto dto, Guid? currentUserId)
    {
        if (dto.PlannedQuantity <= 0)
            throw new BadRequestException("PlannedQuantity must be greater than zero.");

        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId);
        if (product == null || !product.IsActive)
            throw new BadRequestException("Product must exist and be active.");

        // Get active BOM for the product
        var bom = await _unitOfWork.BOMs.GetActiveByProductIdAsync(dto.ProductId);
        if (bom == null)
            throw new BadRequestException("Product must have an active BOM to create a Production Plan.");

        await _unitOfWork.BeginTransactionAsync();

        try
        {
            var plan = new ProductionPlan
            {
                PlanNumber = await _unitOfWork.ProductionPlans.GeneratePlanNumberAsync(),
                ProductId = dto.ProductId,
                PlannedQuantity = dto.PlannedQuantity,
                PlannedStartDate = dto.PlannedStartDate,
                PlannedEndDate = dto.PlannedEndDate,
                Priority = dto.Priority,
                Status = ProductionPlanStatus.Draft,
                Remarks = dto.Remarks,
                CreatedBy = currentUserId
            };

            // Generate Requirements (MRP calculation)
            foreach (var item in bom.BOMItems)
            {
                var requiredQty = item.Quantity * dto.PlannedQuantity;
                
                // Retrieve inventory availability (across all warehouses)
                var inventoryRecords = await _unitOfWork.Inventories.GetByProductIdAsync(item.RawMaterialProductId);
                var availableQty = inventoryRecords.Sum(i => i.QuantityAvailable);

                var shortage = requiredQty > availableQty ? requiredQty - availableQty : 0;

                plan.Requirements.Add(new ProductionRequirement
                {
                    ProductId = item.RawMaterialProductId,
                    RequiredQuantity = requiredQty,
                    AvailableQuantity = availableQty,
                    ShortageQuantity = shortage,
                    UnitId = item.UnitId
                });
            }

            await _unitOfWork.ProductionPlans.AddAsync(plan);
            await _unitOfWork.SaveChangesAsync();

            await _auditLogger.LogAsync("Create", "ProductionPlan", plan.Id.ToString(), newValues: $"PlanNumber: {plan.PlanNumber}, ProductId: {plan.ProductId}, Quantity: {plan.PlannedQuantity}");

            await _unitOfWork.CommitTransactionAsync();

            var createdPlan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(plan.Id);
            return MapToDto(createdPlan!);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<ProductionPlanDto> UpdateAsync(Guid id, UpdateProductionPlanDto dto, Guid? currentUserId)
    {
        if (dto.PlannedQuantity <= 0)
            throw new BadRequestException("PlannedQuantity must be greater than zero.");

        var plan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(id);
        if (plan == null)
            throw new KeyNotFoundException($"ProductionPlan with ID {id} not found.");

        if (plan.Status != ProductionPlanStatus.Draft)
            throw new BadRequestException("Only Draft plans can be edited.");

        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId);
        if (product == null || !product.IsActive)
            throw new BadRequestException("Product must exist and be active.");

        var bom = await _unitOfWork.BOMs.GetActiveByProductIdAsync(dto.ProductId);
        if (bom == null)
            throw new BadRequestException("Product must have an active BOM to create/update a Production Plan.");

        await _unitOfWork.BeginTransactionAsync();

        try
        {
            var oldValues = $"ProductId: {plan.ProductId}, Quantity: {plan.PlannedQuantity}";

            plan.ProductId = dto.ProductId;
            plan.PlannedQuantity = dto.PlannedQuantity;
            plan.PlannedStartDate = dto.PlannedStartDate;
            plan.PlannedEndDate = dto.PlannedEndDate;
            plan.Priority = dto.Priority;
            plan.Remarks = dto.Remarks;
            plan.UpdatedBy = currentUserId;
            plan.UpdatedAt = DateTime.UtcNow;

            // Recalculate requirements
            plan.Requirements.Clear();

            foreach (var item in bom.BOMItems)
            {
                var requiredQty = item.Quantity * dto.PlannedQuantity;
                var inventoryRecords = await _unitOfWork.Inventories.GetByProductIdAsync(item.RawMaterialProductId);
                var availableQty = inventoryRecords.Sum(i => i.QuantityAvailable);
                var shortage = requiredQty > availableQty ? requiredQty - availableQty : 0;

                plan.Requirements.Add(new ProductionRequirement
                {
                    ProductionPlanId = plan.Id,
                    ProductId = item.RawMaterialProductId,
                    RequiredQuantity = requiredQty,
                    AvailableQuantity = availableQty,
                    ShortageQuantity = shortage,
                    UnitId = item.UnitId
                });
            }

            _unitOfWork.ProductionPlans.Update(plan);
            await _unitOfWork.SaveChangesAsync();

            var newValues = $"ProductId: {plan.ProductId}, Quantity: {plan.PlannedQuantity}";
            await _auditLogger.LogAsync("Update", "ProductionPlan", plan.Id.ToString(), oldValues: oldValues, newValues: newValues);

            await _unitOfWork.CommitTransactionAsync();

            var updatedPlan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(plan.Id);
            return MapToDto(updatedPlan!);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<bool> DeleteAsync(Guid id, Guid? currentUserId)
    {
        var plan = await _unitOfWork.ProductionPlans.GetByIdAsync(id);
        if (plan == null) return false;

        if (plan.Status != ProductionPlanStatus.Draft)
            throw new BadRequestException("Only Draft plans can be deleted.");

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            _unitOfWork.ProductionPlans.Delete(plan);
            await _unitOfWork.SaveChangesAsync();

            await _auditLogger.LogAsync("Delete", "ProductionPlan", plan.Id.ToString(), oldValues: $"PlanNumber: {plan.PlanNumber}");

            await _unitOfWork.CommitTransactionAsync();
            return true;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<ProductionPlanDto> ReleaseAsync(Guid id, Guid? currentUserId)
    {
        var plan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(id);
        if (plan == null)
            throw new KeyNotFoundException($"ProductionPlan with ID {id} not found.");

        if (plan.Status != ProductionPlanStatus.Draft)
            throw new BadRequestException($"Cannot release plan because its status is {plan.Status}.");

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var shortagesList = new List<object>();

            // Re-calculate shortages on release to ensure up-to-date data.
            foreach (var req in plan.Requirements)
            {
                var inventoryRecords = await _unitOfWork.Inventories.GetByProductIdAsync(req.ProductId);
                var availableQty = inventoryRecords.Sum(i => i.QuantityAvailable);
                var shortage = req.RequiredQuantity > availableQty ? req.RequiredQuantity - availableQty : 0;

                req.AvailableQuantity = availableQty;
                req.ShortageQuantity = shortage;

                if (shortage > 0)
                {
                    shortagesList.Add(new
                    {
                        componentId = req.ProductId,
                        componentName = req.Product?.Name ?? "Unknown",
                        required = req.RequiredQuantity,
                        available = availableQty,
                        shortage = shortage
                    });
                }
            }

            if (shortagesList.Any())
            {
                throw new MaterialShortageException("Production cannot be released because required materials are insufficient.", shortagesList);
            }

            var oldValues = $"Status: {plan.Status}";
            plan.Status = ProductionPlanStatus.Released;
            plan.UpdatedBy = currentUserId;
            plan.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.ProductionPlans.Update(plan);
            await _unitOfWork.SaveChangesAsync();

            var newValues = $"Status: {plan.Status}";
            await _auditLogger.LogAsync("StatusChange", "ProductionPlan", plan.Id.ToString(), oldValues: oldValues, newValues: newValues);

            await _unitOfWork.CommitTransactionAsync();
            return MapToDto(plan);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<NovaERP.Application.DTOs.Procurement.PurchaseRequestDto> GeneratePurchaseRequestAsync(Guid id, Guid? currentUserId)
    {
        var plan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(id);
        if (plan == null)
            throw new KeyNotFoundException($"ProductionPlan with ID {id} not found.");

        if (plan.Status != ProductionPlanStatus.Draft)
            throw new BadRequestException("Purchase Requests can only be generated from Draft Production Plans.");

        var shortages = new List<NovaERP.Application.DTOs.Procurement.CreatePurchaseRequestItemDto>();
        
        foreach (var req in plan.Requirements)
        {
            var inventoryRecords = await _unitOfWork.Inventories.GetByProductIdAsync(req.ProductId);
            var availableQty = inventoryRecords.Sum(i => i.QuantityAvailable);
            var shortage = req.RequiredQuantity > availableQty ? req.RequiredQuantity - availableQty : 0;
            
            if (shortage > 0)
            {
                shortages.Add(new NovaERP.Application.DTOs.Procurement.CreatePurchaseRequestItemDto
                {
                    ProductId = req.ProductId,
                    RequestedQuantity = shortage,
                    Remarks = $"Auto-generated for Production Plan {plan.PlanNumber}"
                });
            }
        }

        if (!shortages.Any())
            throw new BadRequestException("No material shortages found. Purchase Request is not required.");

        var prService = (IPurchaseRequestService)_unitOfWork.GetType().Assembly.GetType("NovaERP.Infrastructure.Services.PurchaseRequestService")?.GetConstructors()[0].Invoke(new object[] { _unitOfWork, _auditLogger, null });
        // Since we are injecting IPurchaseRequestService in the constructor of ProductionPlanService might cause a circular dependency if not careful.
        // It's better to request IPurchaseRequestService via constructor, but I'll add it now. Wait, I will just create the entity directly to avoid circular dependency in DI.

        var pr = new PurchaseRequest
        {
            RequestNumber = await _unitOfWork.PurchaseRequests.GeneratePRNumberAsync(),
            RequestedBy = "System", // Or get from currentUser if we had user service here
            Department = "Production",
            RequestDate = DateTime.UtcNow,
            RequiredByDate = plan.PlannedStartDate.AddDays(-1), // Require 1 day before prod
            Priority = PurchaseRequestPriority.High,
            Reason = $"Shortages for Production Plan {plan.PlanNumber}",
            Status = PurchaseRequestStatus.Draft,
            Source = PurchaseRequestSource.ProductionShortage,
            SourceReferenceId = plan.Id
        };

        foreach (var s in shortages)
        {
            var p = await _unitOfWork.Products.GetByIdAsync(s.ProductId);
            pr.Items.Add(new PurchaseRequestItem
            {
                ProductId = s.ProductId,
                Product = p,
                RequestedQuantity = s.RequestedQuantity,
                ApprovedQuantity = 0,
                ConvertedQuantity = 0,
                Remarks = s.Remarks
            });
        }

        await _unitOfWork.PurchaseRequests.AddAsync(pr);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "PurchaseRequest", pr.Id.ToString(), newValues: $"Source: ProductionPlan {plan.Id}");

        // Now map to DTO
        return new NovaERP.Application.DTOs.Procurement.PurchaseRequestDto
        {
            Id = pr.Id,
            RequestNumber = pr.RequestNumber,
            RequestedBy = pr.RequestedBy,
            Department = pr.Department,
            RequestDate = pr.RequestDate,
            RequiredByDate = pr.RequiredByDate,
            Priority = pr.Priority,
            Reason = pr.Reason,
            Status = pr.Status,
            Source = pr.Source,
            SourceReferenceId = pr.SourceReferenceId,
            Items = pr.Items.Select(i => new NovaERP.Application.DTOs.Procurement.PurchaseRequestItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? "",
                RequestedQuantity = i.RequestedQuantity
            }).ToList()
        };
    }

    public async Task<List<ProductionRequirementDto>> GetRequirementsAsync(Guid id)
    {
        var plan = await _unitOfWork.ProductionPlans.GetWithRequirementsAsync(id);
        if (plan == null)
            throw new KeyNotFoundException($"ProductionPlan with ID {id} not found.");

        var dtos = new List<ProductionRequirementDto>();
        foreach (var req in plan.Requirements)
        {
            var inventoryRecords = await _unitOfWork.Inventories.GetByProductIdAsync(req.ProductId);
            var availableQty = inventoryRecords.Sum(i => i.QuantityAvailable);
            var shortage = req.RequiredQuantity > availableQty ? req.RequiredQuantity - availableQty : 0;

            var dto = MapRequirementToDto(req);
            dto.AvailableQuantity = availableQty;
            dto.ShortageQuantity = shortage;
            dtos.Add(dto);
        }

        return dtos;
    }

    private static ProductionPlanDto MapToDto(ProductionPlan p) => new()
    {
        Id = p.Id,
        PlanNumber = p.PlanNumber,
        ProductId = p.ProductId,
        ProductCode = p.Product?.ProductCode ?? string.Empty,
        ProductName = p.Product?.Name ?? string.Empty,
        PlannedQuantity = p.PlannedQuantity,
        PlannedStartDate = p.PlannedStartDate,
        PlannedEndDate = p.PlannedEndDate,
        Priority = p.Priority.ToString(),
        Status = p.Status.ToString(),
        Remarks = p.Remarks,
        CreatedBy = p.CreatedBy,
        CreatedAt = p.CreatedAt,
        UpdatedBy = p.UpdatedBy,
        UpdatedAt = p.UpdatedAt,
        Requirements = p.Requirements?.Select(MapRequirementToDto).ToList() ?? new List<ProductionRequirementDto>()
    };

    private static ProductionRequirementDto MapRequirementToDto(ProductionRequirement r) => new()
    {
        Id = r.Id,
        ProductionPlanId = r.ProductionPlanId,
        ProductId = r.ProductId,
        ProductCode = r.Product?.ProductCode ?? string.Empty,
        ProductName = r.Product?.Name ?? string.Empty,
        UnitId = r.UnitId,
        UnitName = r.Unit?.Name,
        RequiredQuantity = r.RequiredQuantity,
        AvailableQuantity = r.AvailableQuantity,
        ShortageQuantity = r.ShortageQuantity,
        CreatedAt = r.CreatedAt
    };
}
