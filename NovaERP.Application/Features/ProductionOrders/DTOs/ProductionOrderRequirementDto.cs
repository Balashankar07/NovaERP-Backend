using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.ProductionOrders.DTOs;

public class ProductionOrderRequirementDto
{
    public Guid Id { get; set; }
    public Guid ProductionOrderId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? UnitId { get; set; }
    public decimal RequiredQuantity { get; set; }
    public decimal ConsumedQuantity { get; set; }
}
