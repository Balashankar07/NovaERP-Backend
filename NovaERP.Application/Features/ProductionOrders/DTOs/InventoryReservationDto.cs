using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.ProductionOrders.DTOs;

public class InventoryReservationDto
{
    public Guid Id { get; set; }
    public Guid ProductionOrderId { get; set; }
    public Guid ProductionOrderRequirementId { get; set; }
    public Guid InventoryId { get; set; }
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid? WarehouseLocationId { get; set; }
    public decimal QuantityReserved { get; set; }
    public decimal QuantityConsumed { get; set; }
    public ReservationStatus Status { get; set; }
    public DateTime? ReleasedAt { get; set; }
}
