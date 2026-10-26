using System.ComponentModel.DataAnnotations;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.ProductionOrders.DTOs;

public class UpdateProductionOrderDto
{
    [Range(0.01, 100000, ErrorMessage = "Planned quantity must be between 1 and 100,000 units.")]
    public decimal PlannedQuantity { get; set; }

    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }

    public string? WorkCenter { get; set; }
    public string? Supervisor { get; set; }

    public ProductionOrderPriority Priority { get; set; }

    public string? Remarks { get; set; }
}
