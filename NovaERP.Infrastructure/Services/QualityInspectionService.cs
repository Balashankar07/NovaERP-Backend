using System.Linq;
using System.Linq.Expressions;
using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.QualityInspections.DTOs;
using NovaERP.Application.DTOs.Notifications;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class QualityInspectionService : IQualityInspectionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly IInventoryMovementService _inventoryMovementService;
    private readonly INotificationService _notificationService;

    public QualityInspectionService(IUnitOfWork unitOfWork, IAuditLogger auditLogger, IInventoryMovementService inventoryMovementService, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _inventoryMovementService = inventoryMovementService;
        _notificationService = notificationService;
    }

    public async Task<PagedResult<QualityInspectionDto>> GetQualityInspectionsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var items = await _unitOfWork.QualityInspections.GetAllPagedAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        
        var dtos = items.Items.Select(MapToDto).ToList();
        return new PagedResult<QualityInspectionDto>
        {
            Items = dtos,
            TotalCount = items.TotalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<QualityInspectionDto> GetQualityInspectionByIdAsync(Guid id)
    {
        var inspection = await _unitOfWork.QualityInspections.GetByIdWithDetailsAsync(id);
        if (inspection == null)
            throw new KeyNotFoundException(nameof(QualityInspection) + " not found");
            
        return MapToDto(inspection);
    }

    public async Task<QualityInspectionDto> CreateAsync(CreateQualityInspectionDto dto, Guid? currentUserId)
    {
        var execution = await _unitOfWork.ProductionExecutions.GetByIdAsync(dto.ProductionExecutionId);
        if (execution == null)
            throw new KeyNotFoundException(nameof(ProductionExecution) + " not found");
            
        if (execution.Status != ProductionExecutionStatus.Completed)
            throw new BadRequestException("Quality Inspection can only be created for Completed Production Executions.");
            
        // Check if inspection already exists
        if (await _unitOfWork.QualityInspections.ExistsByExecutionIdAsync(dto.ProductionExecutionId))
            throw new BadRequestException("A Quality Inspection already exists for this Production Execution.");

        var inspectionNumber = await _unitOfWork.QualityInspections.GenerateInspectionNumberAsync();

        var inspection = new QualityInspection
        {
            InspectionNumber = inspectionNumber,
            ProductionExecutionId = dto.ProductionExecutionId,
            ProductId = dto.ProductId,
            InspectedQuantity = dto.InspectedQuantity,
            OutputWarehouseId = execution.OutputWarehouseId,
            OutputWarehouseLocationId = execution.OutputWarehouseLocationId,
            Remarks = dto.Remarks,
            Status = QualityInspectionStatus.Draft,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.QualityInspections.AddAsync(inspection);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Create", "QualityInspection", inspection.Id.ToString(), newValues: "Inspection created");

        // Notify Quality Engineer about new inspection
        try
        {
            await _notificationService.NotifyRoleUsersAsync(
                "Quality Engineer",
                NotificationType.QualityAlert,
                $"New Quality Inspection Required: {inspection.InspectionNumber}",
                $"A new quality inspection {inspection.InspectionNumber} has been created for Product {inspection.ProductId} and requires your attention.",
                NotificationPriority.Normal,
                "QualityInspection", inspection.Id.ToString(),
                $"/quality/inspections",
                $"qi-created-{inspection.Id}"
            );
        }
        catch { /* Non-critical */ }

        return await GetQualityInspectionByIdAsync(inspection.Id);
    }

    public async Task<QualityInspectionDto> UpdateAsync(Guid id, UpdateQualityInspectionDto dto, Guid? currentUserId)
    {
        var inspection = await _unitOfWork.QualityInspections.GetByIdAsync(id);
        if (inspection == null)
            throw new KeyNotFoundException(nameof(QualityInspection) + " not found");
            
        if (inspection.Status == QualityInspectionStatus.Passed || inspection.Status == QualityInspectionStatus.PartiallyPassed || inspection.Status == QualityInspectionStatus.Failed || inspection.Status == QualityInspectionStatus.Cancelled)
            throw new BadRequestException("Cannot update a completed or cancelled inspection.");

        if (dto.PassedQuantity + dto.FailedQuantity > inspection.InspectedQuantity)
            throw new BadRequestException("Passed Quantity and Failed Quantity cannot exceed Inspected Quantity.");

        inspection.PassedQuantity = dto.PassedQuantity;
        inspection.FailedQuantity = dto.FailedQuantity;
        inspection.Remarks = dto.Remarks;
        inspection.UpdatedBy = currentUserId;
        inspection.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.QualityInspections.Update(inspection);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Update", "QualityInspection", id.ToString(), newValues: $"Passed: {dto.PassedQuantity}, Failed: {dto.FailedQuantity}");

        return await GetQualityInspectionByIdAsync(id);
    }

    public async Task DeleteAsync(Guid id, Guid? currentUserId)
    {
        var inspection = await _unitOfWork.QualityInspections.GetByIdAsync(id);
        if (inspection == null)
            throw new KeyNotFoundException(nameof(QualityInspection) + " not found");
            
        if (inspection.Status != QualityInspectionStatus.Draft)
            throw new BadRequestException("Only Draft inspections can be deleted.");

        _unitOfWork.QualityInspections.Remove(inspection);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Delete", "QualityInspection", id.ToString(), oldValues: inspection.InspectionNumber);
    }

    public async Task<QualityInspectionDto> StartAsync(Guid id, Guid? currentUserId)
    {
        var inspection = await _unitOfWork.QualityInspections.GetByIdAsync(id);
        if (inspection == null)
            throw new KeyNotFoundException(nameof(QualityInspection) + " not found");
            
        if (inspection.Status != QualityInspectionStatus.Draft)
            throw new BadRequestException("Only Draft inspections can be started.");

        inspection.Status = QualityInspectionStatus.InProgress;
        inspection.InspectorId = currentUserId;
        inspection.InspectionDate = DateTime.UtcNow;
        inspection.UpdatedBy = currentUserId;
        inspection.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.QualityInspections.Update(inspection);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "QualityInspection", id.ToString(), oldValues: QualityInspectionStatus.Draft.ToString(), newValues: QualityInspectionStatus.InProgress.ToString());

        return await GetQualityInspectionByIdAsync(id);
    }

    public async Task<QualityInspectionDto> CompleteAsync(Guid id, Guid? currentUserId)
    {
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var inspection = await _unitOfWork.QualityInspections.GetByIdAsync(id);
            if (inspection == null)
                throw new KeyNotFoundException(nameof(QualityInspection) + " not found");
                
            if (inspection.Status != QualityInspectionStatus.InProgress)
                throw new BadRequestException("Only InProgress inspections can be completed.");
                
            if (inspection.PassedQuantity + inspection.FailedQuantity != inspection.InspectedQuantity)
                throw new BadRequestException("Passed Quantity and Failed Quantity must equal Inspected Quantity.");

            if (inspection.OutputWarehouseId == null)
            {
                var defaultWh = await _unitOfWork.Warehouses.GetDefaultWarehouseAsync();
                if (defaultWh != null)
                {
                    inspection.OutputWarehouseId = defaultWh.Id;
                }
                else
                {
                    var allWh = await _unitOfWork.Warehouses.GetAllAsync();
                    Warehouse? wh = null;
                    if (allWh?.Items != null)
                    {
                        foreach (var item in allWh.Items)
                        {
                            if (item.IsActive)
                            {
                                wh = item;
                                break;
                            }
                        }
                    }

                    if (wh != null)
                    {
                        inspection.OutputWarehouseId = wh.Id;
                    }
                    else
                    {
                        throw new BadRequestException("Quality Inspection has no Output Warehouse configured and no active warehouse exists.");
                    }
                }
            }

            if (inspection.PassedQuantity == inspection.InspectedQuantity)
                inspection.Status = QualityInspectionStatus.Passed;
            else if (inspection.FailedQuantity == inspection.InspectedQuantity)
                inspection.Status = QualityInspectionStatus.Failed;
            else
                inspection.Status = QualityInspectionStatus.PartiallyPassed;
                
            inspection.UpdatedBy = currentUserId;
            inspection.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.QualityInspections.Update(inspection);
            
            try 
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
            {
                throw new ConflictException("The inspection was modified or completed by another user.");
            }

            if (inspection.PassedQuantity > 0)
            {
                await _inventoryMovementService.ReceiveAsync(
                    inspection.ProductId,
                    inspection.OutputWarehouseId.Value,
                    inspection.OutputWarehouseLocationId,
                    inspection.PassedQuantity,
                    InventoryReferenceType.Production, // We will use Production
                    inspection.Id,
                    $"Quality Approval {inspection.InspectionNumber}",
                    currentUserId
                );
                
                await _unitOfWork.SaveChangesAsync();
            }

            await _unitOfWork.CommitTransactionAsync();
            await _auditLogger.LogAsync("StatusChange", "QualityInspection", id.ToString(), oldValues: QualityInspectionStatus.InProgress.ToString(), newValues: inspection.Status.ToString());

            // Notify Production Manager if inspection failed or partially passed
            if (inspection.Status == QualityInspectionStatus.Failed || inspection.Status == QualityInspectionStatus.PartiallyPassed)
            {
                try
                {
                    await _notificationService.NotifyRoleUsersAsync(
                        "Production Manager",
                        NotificationType.QualityAlert,
                        $"Quality Alert: Inspection {inspection.InspectionNumber}",
                        $"Quality inspection {inspection.InspectionNumber} finished with status {inspection.Status}. Failed quantity: {inspection.FailedQuantity}.",
                        NotificationPriority.Critical,
                        "QualityInspection", inspection.Id.ToString(),
                        $"/quality/inspections",
                        $"qi-failed-{inspection.Id}"
                    );
                }
                catch { /* Non-critical */ }
            }

            return await GetQualityInspectionByIdAsync(id);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<QualityInspectionDto> CancelAsync(Guid id, string reason, Guid? currentUserId)
    {
        var inspection = await _unitOfWork.QualityInspections.GetByIdAsync(id);
        if (inspection == null)
            throw new KeyNotFoundException(nameof(QualityInspection) + " not found");
            
        if (inspection.Status == QualityInspectionStatus.Passed || inspection.Status == QualityInspectionStatus.PartiallyPassed || inspection.Status == QualityInspectionStatus.Failed || inspection.Status == QualityInspectionStatus.Cancelled)
            throw new BadRequestException("Completed or Cancelled inspections cannot be cancelled.");

        inspection.Status = QualityInspectionStatus.Cancelled;
        inspection.Remarks = string.IsNullOrEmpty(inspection.Remarks) ? $"Cancelled: {reason}" : $"{inspection.Remarks} | Cancelled: {reason}";
        inspection.UpdatedBy = currentUserId;
        inspection.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.QualityInspections.Update(inspection);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "QualityInspection", id.ToString(), oldValues: inspection.Status.ToString(), newValues: QualityInspectionStatus.Cancelled.ToString());

        return await GetQualityInspectionByIdAsync(id);
    }

    public async Task<QualityInspectionDto> AddDefectAsync(Guid inspectionId, CreateQualityDefectDto dto, Guid? currentUserId)
    {
        var inspection = await _unitOfWork.QualityInspections.GetByIdWithDetailsAsync(inspectionId);
        if (inspection == null)
            throw new KeyNotFoundException(nameof(QualityInspection) + " not found");
            
        if (inspection.Status == QualityInspectionStatus.Passed || inspection.Status == QualityInspectionStatus.PartiallyPassed || inspection.Status == QualityInspectionStatus.Failed || inspection.Status == QualityInspectionStatus.Cancelled)
            throw new BadRequestException("Cannot add defects to a completed or cancelled inspection.");
            
        var defect = new QualityDefect
        {
            QualityInspectionId = inspectionId,
            DefectCode = dto.DefectCode,
            DefectName = dto.DefectName,
            Quantity = dto.Quantity,
            Severity = dto.Severity,
            Remarks = dto.Remarks,
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow
        };
        
        inspection.QualityDefects.Add(defect);
        _unitOfWork.QualityInspections.Update(inspection);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Create", "QualityDefect", defect.Id.ToString(), newValues: $"Defect {dto.DefectCode} logged");
        
        return await GetQualityInspectionByIdAsync(inspectionId);
    }

    public async Task RemoveDefectAsync(Guid inspectionId, Guid defectId, Guid? currentUserId)
    {
        var inspection = await _unitOfWork.QualityInspections.GetByIdWithDetailsAsync(inspectionId);
        if (inspection == null)
            throw new KeyNotFoundException(nameof(QualityInspection) + " not found");
            
        if (inspection.Status == QualityInspectionStatus.Passed || inspection.Status == QualityInspectionStatus.PartiallyPassed || inspection.Status == QualityInspectionStatus.Failed || inspection.Status == QualityInspectionStatus.Cancelled)
            throw new BadRequestException("Cannot remove defects from a completed or cancelled inspection.");
            
        var defect = inspection.QualityDefects.FirstOrDefault(d => d.Id == defectId);
        if (defect == null)
            throw new KeyNotFoundException(nameof(QualityDefect) + " not found");
            
        inspection.QualityDefects.Remove(defect);
        _unitOfWork.QualityInspections.Update(inspection);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("Delete", "QualityDefect", defectId.ToString(), oldValues: $"Defect {defect.DefectCode} removed");
    }

    private static QualityInspectionDto MapToDto(QualityInspection entity)
    {
        return new QualityInspectionDto
        {
            Id = entity.Id,
            InspectionNumber = entity.InspectionNumber,
            ProductionExecutionId = entity.ProductionExecutionId,
            ProductionExecutionNumber = entity.ProductionExecution?.ExecutionNumber,
            ProductId = entity.ProductId,
            ProductName = entity.Product?.Name,
            ProductCode = entity.Product?.ProductCode,
            InspectedQuantity = entity.InspectedQuantity,
            PassedQuantity = entity.PassedQuantity,
            FailedQuantity = entity.FailedQuantity,
            Status = entity.Status.ToString(),
            InspectorId = entity.InspectorId,
            InspectionDate = entity.InspectionDate,
            Remarks = entity.Remarks,
            OutputWarehouseId = entity.OutputWarehouseId,
            OutputWarehouseLocationId = entity.OutputWarehouseLocationId,
            QualityDefects = entity.QualityDefects?.Select(d => new QualityDefectDto
            {
                Id = d.Id,
                QualityInspectionId = d.QualityInspectionId,
                DefectCode = d.DefectCode,
                DefectName = d.DefectName,
                Quantity = d.Quantity,
                Severity = d.Severity,
                Remarks = d.Remarks
            }).ToList() ?? new List<QualityDefectDto>()
        };
    }
}
