using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ProductionExecution : AuditableEntity
{
    public string ExecutionNumber { get; set; } = string.Empty;
    public Guid ProductionOrderId { get; set; }
    
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    public decimal ProducedQuantity { get; set; }
    public decimal RejectedQuantity { get; set; }
    
    public ProductionExecutionStatus Status { get; set; } = ProductionExecutionStatus.Draft;
    
    public string? Remarks { get; set; }

    public ProductionOrder? ProductionOrder { get; set; }

    public Guid? OutputWarehouseId { get; set; }
    public Warehouse? OutputWarehouse { get; set; }

    public Guid? OutputWarehouseLocationId { get; set; }
    public WarehouseLocation? OutputWarehouseLocation { get; set; }

    public ICollection<MaterialConsumption> MaterialConsumptions { get; set; } = new List<MaterialConsumption>();
}
