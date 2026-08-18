using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.ProductionOrders.DTOs;

public class ProductionOrderDto
{
    public Guid Id { get; set; }
    public string ProductionOrderNumber { get; set; } = string.Empty;

    public Guid ProductionPlanId { get; set; }
    public Guid ProductId { get; set; }

    public decimal PlannedQuantity { get; set; }
    public decimal StartedQuantity { get; set; }
    public decimal CompletedQuantity { get; set; }
    public decimal RejectedQuantity { get; set; }

    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }

    public string? WorkCenter { get; set; }
    public string? Supervisor { get; set; }

    public ProductionOrderPriority Priority { get; set; }
    public ProductionOrderStatus Status { get; set; }

    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }

    public List<ProductionOrderRequirementDto> Materials { get; set; } = new();
}
