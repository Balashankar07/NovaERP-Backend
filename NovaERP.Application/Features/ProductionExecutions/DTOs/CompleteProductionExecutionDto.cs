using System.ComponentModel.DataAnnotations;

namespace NovaERP.Application.Features.ProductionExecutions.DTOs;

public class CompleteProductionExecutionDto
{
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Produced quantity must be non-negative.")]
    public decimal ProducedQuantity { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Rejected quantity must be non-negative.")]
    public decimal RejectedQuantity { get; set; }

    [Required(ErrorMessage = "Output warehouse is required.")]
    public Guid OutputWarehouseId { get; set; }

    public Guid? OutputWarehouseLocationId { get; set; }
}
