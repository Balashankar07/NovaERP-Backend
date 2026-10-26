using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.GoodsReceipts.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class GoodsReceiptService : IGoodsReceiptService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly IInventoryMovementService _inventoryMovementService;
    private readonly INotificationService _notificationService;

    public GoodsReceiptService(
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

    public async Task<PagedResult<GoodsReceiptDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var pagedGRNs = await _unitOfWork.GoodsReceipts.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        
        return new PagedResult<GoodsReceiptDto>
        {
            Items = pagedGRNs.Items.Select(MapToDto).ToList(),
            TotalCount = pagedGRNs.TotalCount,
            PageNumber = pagedGRNs.PageNumber,
            PageSize = pagedGRNs.PageSize
        };
    }

    public async Task<GoodsReceiptDto?> GetByIdAsync(Guid id)
    {
        var grn = await _unitOfWork.GoodsReceipts.GetGoodsReceiptWithItemsAsync(id);
        if (grn == null) return null;
        var dto = MapToDto(grn);

        try
        {
            var pagedInspections = await _unitOfWork.QualityInspections.GetAllPagedAsync(1, 100);
            var grnInspections = pagedInspections.Items.Where(q => q.GoodsReceiptId == id).ToList();
            foreach (var item in dto.Items)
            {
                var qi = grnInspections.FirstOrDefault(q => q.GoodsReceiptItemId == item.Id);
                if (qi != null)
                {
                    item.QualityInspectionId = qi.Id;
                    item.QualityInspectionStatus = qi.Status.ToString();
                    item.InspectedQuantity = qi.InspectedQuantity;
                    item.PassedQuantity = qi.PassedQuantity;
                    item.FailedQuantity = qi.FailedQuantity;
                }
            }
        }
        catch { /* Non-critical */ }

        return dto;
    }

    public async Task<GoodsReceiptDto> CreateAsync(Guid currentUserId, CreateGoodsReceiptDto dto)
    {
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var po = await _unitOfWork.PurchaseOrders.GetPurchaseOrderWithItemsAsync(dto.PurchaseOrderId);
            if (po == null)
                throw new Exception("Purchase Order not found.");

            if (po.Status != PurchaseOrderStatus.Approved && po.Status != PurchaseOrderStatus.Sent && po.Status != PurchaseOrderStatus.PartiallyReceived)
                throw new Exception("Goods Receipt can only be created from an Approved, Sent, or PartiallyReceived Purchase Order.");

            var grn = new GoodsReceipt
            {
                GRNNumber = await _unitOfWork.GoodsReceipts.GenerateGRNNumberAsync(),
                PurchaseOrderId = po.Id,
                SupplierId = po.SupplierId,
                WarehouseId = dto.WarehouseId,
                WarehouseLocationId = dto.WarehouseLocationId,
                ReceiptDate = DateTime.UtcNow,
                Status = GoodsReceiptStatus.Draft,
                Remarks = dto.Remarks,
                ReceivedBy = currentUserId,
                IsActive = true
            };

            var purchaseOrderItemIds = dto.Items.Select(i => i.PurchaseOrderItemId).Distinct().ToList();
            if (purchaseOrderItemIds.Count != dto.Items.Count)
                throw new Exception("Duplicate purchase order items are not allowed in the same GRN.");

            var existingGRNs = await _unitOfWork.GoodsReceipts.GetByPurchaseOrderIdAsync(po.Id);
            var activeGRNs = existingGRNs.Where(g => g.Status != GoodsReceiptStatus.Cancelled).ToList();

            foreach (var itemDto in dto.Items)
            {
                var poItem = po.Items.FirstOrDefault(i => i.Id == itemDto.PurchaseOrderItemId);
                if (poItem == null)
                    throw new Exception($"Purchase Order Item with ID {itemDto.PurchaseOrderItemId} not found in the selected Purchase Order.");

                decimal alreadyReceived = activeGRNs
                    .SelectMany(g => g.Items)
                    .Where(i => i.PurchaseOrderItemId == poItem.Id)
                    .Sum(i => i.ReceivedQuantity);

                if (alreadyReceived + itemDto.ReceivedQuantity > poItem.Quantity)
                    throw new Exception($"Cumulative received quantity ({alreadyReceived + itemDto.ReceivedQuantity}) cannot exceed ordered quantity ({poItem.Quantity}) for product ID {poItem.ProductId}.");

                var item = new GoodsReceiptItem
                {
                    PurchaseOrderItemId = poItem.Id,
                    ProductId = poItem.ProductId,
                    OrderedQuantity = poItem.Quantity,
                    ReceivedQuantity = itemDto.ReceivedQuantity,
                    RejectedQuantity = itemDto.RejectedQuantity,
                    Remarks = itemDto.Remarks
                };
                grn.Items.Add(item);
            }

            await _unitOfWork.GoodsReceipts.AddAsync(grn);
            await _unitOfWork.SaveChangesAsync();

            await _auditLogger.LogAsync("Create", "GoodsReceipt", grn.Id.ToString(), newValues: $"GRNNumber: {grn.GRNNumber}, PurchaseOrderId: {grn.PurchaseOrderId}");

            await _unitOfWork.CommitTransactionAsync();

            // Reload from DB with full navigation properties to avoid null reference in MapToDto
            var savedGrn = await _unitOfWork.GoodsReceipts.GetGoodsReceiptWithItemsAsync(grn.Id);
            return MapToDto(savedGrn ?? grn);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<GoodsReceiptDto?> UpdateAsync(Guid id, UpdateGoodsReceiptDto dto)
    {
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var grn = await _unitOfWork.GoodsReceipts.GetGoodsReceiptWithItemsAsync(id);
            if (grn == null)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return null;
            }

            if (grn.Status != GoodsReceiptStatus.Draft)
                throw new Exception("Only Draft GRNs can be edited.");

            var po = await _unitOfWork.PurchaseOrders.GetPurchaseOrderWithItemsAsync(grn.PurchaseOrderId);
            if (po == null) throw new Exception("Associated Purchase Order not found.");
            
            if (po.Status != PurchaseOrderStatus.Approved && po.Status != PurchaseOrderStatus.Sent && po.Status != PurchaseOrderStatus.PartiallyReceived)
                throw new Exception("Goods Receipt can only be edited for an Approved, Sent, or PartiallyReceived Purchase Order.");

            grn.Remarks = dto.Remarks;
            grn.IsActive = dto.IsActive;

            var purchaseOrderItemIds = dto.Items.Select(i => i.PurchaseOrderItemId).Distinct().ToList();
            if (purchaseOrderItemIds.Count != dto.Items.Count)
                throw new Exception("Duplicate purchase order items are not allowed in the same GRN.");

            var incomingItemIds = dto.Items.Where(i => i.Id.HasValue).Select(i => i.Id!.Value).ToList();
            var itemsToRemove = grn.Items.Where(i => !incomingItemIds.Contains(i.Id)).ToList();
            foreach (var item in itemsToRemove)
            {
                grn.Items.Remove(item);
            }

            var existingGRNs = await _unitOfWork.GoodsReceipts.GetByPurchaseOrderIdAsync(po.Id);
            var activeOtherGRNs = existingGRNs.Where(g => g.Id != grn.Id && g.Status != GoodsReceiptStatus.Cancelled).ToList();

            foreach (var itemDto in dto.Items)
            {
                var poItem = po.Items.FirstOrDefault(i => i.Id == itemDto.PurchaseOrderItemId);
                if (poItem == null)
                    throw new Exception($"Purchase Order Item with ID {itemDto.PurchaseOrderItemId} not found in the selected Purchase Order.");

                decimal alreadyReceivedInOthers = activeOtherGRNs
                    .SelectMany(g => g.Items)
                    .Where(i => i.PurchaseOrderItemId == poItem.Id)
                    .Sum(i => i.ReceivedQuantity);

                if (alreadyReceivedInOthers + itemDto.ReceivedQuantity > poItem.Quantity)
                    throw new Exception($"Cumulative received quantity ({alreadyReceivedInOthers + itemDto.ReceivedQuantity}) cannot exceed ordered quantity ({poItem.Quantity}) for product ID {poItem.ProductId}.");

                if (itemDto.Id.HasValue)
                {
                    var existingItem = grn.Items.FirstOrDefault(i => i.Id == itemDto.Id.Value);
                    if (existingItem != null)
                    {
                        existingItem.PurchaseOrderItemId = poItem.Id;
                        existingItem.ProductId = poItem.ProductId;
                        existingItem.OrderedQuantity = poItem.Quantity;
                        existingItem.ReceivedQuantity = itemDto.ReceivedQuantity;
                        existingItem.RejectedQuantity = itemDto.RejectedQuantity;
                        existingItem.Remarks = itemDto.Remarks;
                    }
                }
                else
                {
                    var newItem = new GoodsReceiptItem
                    {
                        PurchaseOrderItemId = poItem.Id,
                        ProductId = poItem.ProductId,
                        OrderedQuantity = poItem.Quantity,
                        ReceivedQuantity = itemDto.ReceivedQuantity,
                        RejectedQuantity = itemDto.RejectedQuantity,
                        Remarks = itemDto.Remarks
                    };
                    grn.Items.Add(newItem);
                }
            }

            _unitOfWork.GoodsReceipts.Update(grn);
            await _unitOfWork.SaveChangesAsync();

            await _auditLogger.LogAsync("Update", "GoodsReceipt", grn.Id.ToString(), newValues: $"GRNNumber: {grn.GRNNumber}");

            await _unitOfWork.CommitTransactionAsync();
            return MapToDto(grn);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var grn = await _unitOfWork.GoodsReceipts.GetGoodsReceiptWithItemsAsync(id);
        if (grn == null) return false;

        if (grn.Status != GoodsReceiptStatus.Draft)
            throw new Exception("Only Draft GRNs can be deleted.");

        _unitOfWork.GoodsReceipts.Delete(grn);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "GoodsReceipt", grn.Id.ToString(), oldValues: $"GRNNumber: {grn.GRNNumber}");

        return true;
    }

    public async Task<GoodsReceiptDto?> ReceiveAsync(Guid id)
    {
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var grn = await _unitOfWork.GoodsReceipts.GetGoodsReceiptWithItemsAsync(id);
            if (grn == null)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return null;
            }

            if (grn.Status != GoodsReceiptStatus.Draft)
                throw new Exception("Only Draft GRNs can be received.");

            grn.Status = GoodsReceiptStatus.Completed;

            _unitOfWork.GoodsReceipts.Update(grn);
            await _unitOfWork.SaveChangesAsync();
            await _auditLogger.LogAsync("StatusChange", "GoodsReceipt", grn.Id.ToString(), oldValues: "Draft", newValues: "Completed");

            var po = await _unitOfWork.PurchaseOrders.GetPurchaseOrderWithItemsAsync(grn.PurchaseOrderId);
            if (po == null)
            {
                throw new Exception("Purchase Order not found.");
            }

            foreach (var item in grn.Items)
            {
                var poItem = po.Items.FirstOrDefault(i => i.Id == item.PurchaseOrderItemId);
                if (poItem != null)
                {
                    poItem.ReceivedQuantity += item.ReceivedQuantity;
                }
            }
            _unitOfWork.PurchaseOrders.Update(po);
            await _unitOfWork.SaveChangesAsync();

            await CheckAndUpdatePurchaseOrderStatusAsync(po.Id);
            await ProcessInventoryMovementAsync(grn);
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();

            try
            {
                await _notificationService.NotifyRoleUsersAsync(
                    "Quality Engineer",
                    NotificationType.QualityAlert,
                    $"Inbound Goods Arrived: {grn.GRNNumber}",
                    $"Goods receipt {grn.GRNNumber} arrived for PO {po.PONumber}. Quality inspection required.",
                    NotificationPriority.High,
                    "GoodsReceipt", grn.Id.ToString(),
                    $"/quality",
                    $"grn-qa-{grn.Id}"
                );

                await _notificationService.NotifyRoleUsersAsync(
                    "Procurement Manager",
                    NotificationType.ProcurementAlert,
                    $"Goods Received: PO {po.PONumber}",
                    $"Inbound shipment for PO {po.PONumber} has arrived at warehouse dock (GRN {grn.GRNNumber}).",
                    NotificationPriority.Normal,
                    "GoodsReceipt", grn.Id.ToString(),
                    $"/procurement/goods-receipts",
                    $"grn-proc-{grn.Id}"
                );
            }
            catch { /* Non-critical */ }

            return MapToDto(grn);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    private async Task CheckAndUpdatePurchaseOrderStatusAsync(Guid poId)
    {
        var po = await _unitOfWork.PurchaseOrders.GetPurchaseOrderWithItemsAsync(poId);
        if (po == null || po.Status == PurchaseOrderStatus.Closed) return;

        bool allItemsFullyReceived = true;
        bool anyItemReceived = false;

        foreach (var poItem in po.Items)
        {
            if (poItem.ReceivedQuantity > 0)
            {
                anyItemReceived = true;
            }
            if (poItem.ReceivedQuantity < poItem.Quantity)
            {
                allItemsFullyReceived = false;
            }
        }

        var oldStatus = po.Status;
        if (allItemsFullyReceived)
        {
            po.Status = PurchaseOrderStatus.Closed;
        }
        else if (anyItemReceived)
        {
            po.Status = PurchaseOrderStatus.PartiallyReceived;
        }

        if (oldStatus != po.Status)
        {
            _unitOfWork.PurchaseOrders.Update(po);
            await _unitOfWork.SaveChangesAsync();
            await _auditLogger.LogAsync("StatusChange", "PurchaseOrder", po.Id.ToString(), oldValues: oldStatus.ToString(), newValues: po.Status.ToString());
        }
    }

    public async Task<GoodsReceiptDto?> CancelAsync(Guid id)
    {
        var grn = await _unitOfWork.GoodsReceipts.GetGoodsReceiptWithItemsAsync(id);
        if (grn == null) return null;

        if (grn.Status != GoodsReceiptStatus.Draft)
            throw new Exception("Only Draft GRNs can be cancelled.");

        grn.Status = GoodsReceiptStatus.Cancelled;

        _unitOfWork.GoodsReceipts.Update(grn);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("StatusChange", "GoodsReceipt", grn.Id.ToString(), oldValues: "Draft", newValues: "Cancelled");

        return MapToDto(grn);
    }

    private async Task ProcessInventoryMovementAsync(GoodsReceipt grn)
    {
        var warehouseId = grn.WarehouseId;
        if (!warehouseId.HasValue)
        {
            var defaultWarehouse = await _unitOfWork.Warehouses.GetDefaultWarehouseAsync();
            if (defaultWarehouse == null) throw new Exception("No default warehouse is configured and no specific warehouse was provided.");
            warehouseId = defaultWarehouse.Id;
        }

        var quarantineLocation = await GetOrCreateQuarantineLocationAsync(warehouseId.Value);

        foreach (var item in grn.Items)
        {
            decimal receivedQty = item.ReceivedQuantity - item.RejectedQuantity;
            if (receivedQty > 0)
            {
                // Receive raw material into quarantine location (non-usable inventory state)
                await _inventoryMovementService.ReceiveAsync(
                    item.ProductId,
                    warehouseId.Value,
                    quarantineLocation.Id,
                    receivedQty,
                    InventoryReferenceType.GoodsReceipt,
                    grn.Id,
                    $"Received into QC Quarantine from GRN: {grn.GRNNumber}",
                    grn.ReceivedBy);

                // Auto-create Quality Inspection for incoming goods receipt line in Draft status
                var qiNumber = await _unitOfWork.QualityInspections.GenerateInspectionNumberAsync();
                Guid? destinationLocationId = (grn.WarehouseLocationId.HasValue && grn.WarehouseLocationId.Value != quarantineLocation.Id)
                    ? grn.WarehouseLocationId
                    : null;

                var inspection = new QualityInspection
                {
                    InspectionNumber = qiNumber,
                    GoodsReceiptId = grn.Id,
                    GoodsReceiptItemId = item.Id,
                    ProductId = item.ProductId,
                    InspectedQuantity = receivedQty,
                    PassedQuantity = 0,
                    FailedQuantity = 0,
                    Status = QualityInspectionStatus.Draft,
                    SourceWarehouseLocationId = quarantineLocation.Id,
                    OutputWarehouseId = warehouseId.Value,
                    OutputWarehouseLocationId = destinationLocationId,
                    Remarks = $"Incoming QC Inspection for GRN {grn.GRNNumber}",
                    CreatedBy = grn.ReceivedBy,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.QualityInspections.AddAsync(inspection);
            }
        }
    }

    private async Task<WarehouseLocation> GetOrCreateQuarantineLocationAsync(Guid warehouseId)
    {
        var locations = await _unitOfWork.WarehouseLocations.GetByWarehouseIdAsync(warehouseId);
        var quarantine = locations.FirstOrDefault(l => l.IsQuarantine || string.Equals(l.LocationCode, "QC-QUARANTINE", StringComparison.OrdinalIgnoreCase) || (l.LocationName != null && l.LocationName.Contains("Quarantine", StringComparison.OrdinalIgnoreCase)));
        if (quarantine != null)
        {
            if (!quarantine.IsQuarantine)
            {
                quarantine.IsQuarantine = true;
                _unitOfWork.WarehouseLocations.Update(quarantine);
                await _unitOfWork.SaveChangesAsync();
            }
            return quarantine;
        }

        quarantine = new WarehouseLocation
        {
            Id = Guid.NewGuid(),
            WarehouseId = warehouseId,
            LocationCode = "QC-QUARANTINE",
            LocationName = "QC Quarantine Area",
            Zone = "QC",
            Rack = "Q1",
            Shelf = "S1",
            Bin = "B1",
            Description = "Quarantine storage for incoming raw materials awaiting quality inspection",
            IsQuarantine = true,
            IsActive = true,
            Type = LocationType.Bin,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.WarehouseLocations.AddAsync(quarantine);
        await _unitOfWork.SaveChangesAsync();
        return quarantine;
    }

    private GoodsReceiptDto MapToDto(GoodsReceipt grn)
    {
        return new GoodsReceiptDto
        {
            Id = grn.Id,
            GRNNumber = grn.GRNNumber,
            PurchaseOrderId = grn.PurchaseOrderId,
            PurchaseOrderNumber = grn.PurchaseOrder?.PONumber ?? string.Empty,
            SupplierId = grn.SupplierId,
            SupplierName = grn.Supplier?.SupplierName ?? string.Empty,
            ReceiptDate = grn.ReceiptDate,
            Status = grn.Status.ToString(),
            Remarks = grn.Remarks,
            ReceivedBy = grn.ReceivedBy,
            WarehouseId = grn.WarehouseId,
            WarehouseLocationId = grn.WarehouseLocationId,
            IsActive = grn.IsActive,
            CreatedAt = grn.CreatedAt,
            UpdatedAt = grn.UpdatedAt,
            Items = (grn.Items ?? new List<GoodsReceiptItem>()).Select(i => new GoodsReceiptItemDto
            {
                Id = i.Id,
                GoodsReceiptId = i.GoodsReceiptId,
                PurchaseOrderItemId = i.PurchaseOrderItemId,
                ProductId = i.ProductId,
                ProductCode = i.Product?.ProductCode ?? string.Empty,
                ProductName = i.Product?.Name ?? string.Empty,
                OrderedQuantity = i.OrderedQuantity,
                ReceivedQuantity = i.ReceivedQuantity,
                RejectedQuantity = i.RejectedQuantity,
                Remarks = i.Remarks
            }).ToList()
        };
    }
}
