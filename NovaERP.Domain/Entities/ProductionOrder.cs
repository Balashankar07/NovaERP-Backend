using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ProductionOrder : AuditableEntity
{
    public string ProductionOrderNumber { get; set; } = string.Empty;

    public Guid ProductionPlanId { get; set; }
    public ProductionPlan ProductionPlan { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public ICollection<ProductionExecution> ProductionExecutions { get; set; } = new List<ProductionExecution>();
    public ICollection<ProductionOrderRequirement> Requirements { get; set; } = new List<ProductionOrderRequirement>();
    public ICollection<InventoryReservation> Reservations { get; set; } = new List<InventoryReservation>();

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

    public ProductionOrderPriority Priority { get; set; } = ProductionOrderPriority.Medium;
    public ProductionOrderStatus Status { get; set; } = ProductionOrderStatus.Draft;

    public string? Remarks { get; set; }
}
