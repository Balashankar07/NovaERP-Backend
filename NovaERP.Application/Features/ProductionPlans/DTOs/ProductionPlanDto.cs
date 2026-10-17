namespace NovaERP.Application.Features.ProductionPlans.DTOs;

public class ProductionPlanDto
{
    public Guid Id { get; set; }
    public string PlanNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public Guid? BOMId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal PlannedQuantity { get; set; }
    public DateTime PlannedStartDate { get; set; }
    public DateTime PlannedEndDate { get; set; }
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<ProductionRequirementDto> Requirements { get; set; } = new();
}
