using NovaERP.Application.Features.Inventory.DTOs;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Interfaces.Services;

public interface IInventoryMovementService
{
    Task<InventoryDto> ReceiveAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantity, InventoryReferenceType refType, Guid? refId, string remarks, Guid? currentUserId);
    Task<InventoryDto> IssueAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantity, InventoryReferenceType refType, Guid? refId, string remarks, Guid? currentUserId, Guid? reservationId = null);
    Task<InventoryDto> ReserveAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantity, InventoryReferenceType refType, Guid? refId, string remarks, Guid? currentUserId);
    Task<InventoryDto> ReleaseReservationAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantity, InventoryReferenceType refType, Guid? refId, string remarks, Guid? currentUserId);
    Task<InventoryDto> AdjustAsync(Guid productId, Guid warehouseId, Guid? locationId, decimal quantityDelta, string reason, Guid? currentUserId);
    Task TransferAsync(Guid productId, Guid sourceWarehouseId, Guid? sourceLocationId, Guid destWarehouseId, Guid? destLocationId, decimal quantity, string reason, Guid? currentUserId);

    // Phase 3A Extensions
    Task ReserveForRequirementAsync(Guid productionOrderId, Guid requirementId, Guid productId, decimal quantityRequired, Guid? currentUserId);
    Task ReleaseUnusedReservationsAsync(Guid productionOrderId, Guid? currentUserId);
}
