using System.ComponentModel.DataAnnotations;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.ProductionPlans.DTOs;

public class CreateProductionPlanDto
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    public Guid BOMId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "PlannedQuantity must be greater than zero.")]
    public decimal PlannedQuantity { get; set; }

    [Required]
    public DateTime PlannedStartDate { get; set; }

    [Required]
    public DateTime PlannedEndDate { get; set; }

    [Required]
    public ProductionPlanPriority Priority { get; set; }

    public string? Remarks { get; set; }
}
