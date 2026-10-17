using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ProductionPlan : AuditableEntity
{
    public string PlanNumber { get; set; } = string.Empty;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid? BOMId { get; set; }
    public BOM? BOM { get; set; }

    public decimal PlannedQuantity { get; set; }

    public DateTime PlannedStartDate { get; set; }
    public DateTime PlannedEndDate { get; set; }

    public ProductionPlanPriority Priority { get; set; } = ProductionPlanPriority.Medium;
    public ProductionPlanStatus Status { get; set; } = ProductionPlanStatus.Draft;

    public string? Remarks { get; set; }

    // Navigation Property
    public ICollection<ProductionRequirement> Requirements { get; set; } = new List<ProductionRequirement>();
}
