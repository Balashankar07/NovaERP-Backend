using System;
using System.Collections.Generic;

namespace NovaERP.Application.Features.Reports.DTOs;

public class ProductionSummaryDto
{
    public int ProductionPlansCount { get; set; }
    public int ActiveProductionOrders { get; set; }
    public int PendingExecutions { get; set; }
    public int MaterialShortagesCount { get; set; }
    public int OrdersInProgress { get; set; }
    public int AwaitingQualityCount { get; set; }
    public int CompletedProductionCount { get; set; }
    public decimal TotalProducedQuantity { get; set; }
    public decimal TotalPlannedQuantity { get; set; }
    public decimal TotalRejectedQuantity { get; set; }
    public decimal WastePercentage { get; set; }

    public Dictionary<string, int> PlanPipeline { get; set; } = new();
    public Dictionary<string, int> OrderPipeline { get; set; } = new();

    public List<ProductionMaterialReadinessDto> MaterialReadiness { get; set; } = new();
    public List<ProductionAwaitingQualityDto> AwaitingQualityInspections { get; set; } = new();
    public List<ProductionAttentionItemDto> NeedsAttention { get; set; } = new();
    public List<RecentProductionOrderDto> RecentOrders { get; set; } = new();
    public List<RecentProductionExecutionDto> RecentExecutions { get; set; } = new();
}

public class ProductionMaterialReadinessDto
{
    public Guid ProductionOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal PlannedQuantity { get; set; }
    public string BomName { get; set; } = string.Empty;
    public decimal RequiredComponentQuantity { get; set; }
    public decimal AvailableComponentQuantity { get; set; }
    public decimal ShortageQuantity { get; set; }
    public string ReadinessState { get; set; } = "READY"; // READY, PARTIALLY AVAILABLE, INSUFFICIENT
}

public class ProductionAwaitingQualityDto
{
    public Guid ProductionExecutionId { get; set; }
    public string ExecutionNumber { get; set; } = string.Empty;
    public string ProductionOrderNumber { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal ProducedQuantity { get; set; }
    public string InspectionStatus { get; set; } = "Draft";
    public DateTime? CompletedAt { get; set; }
    public Guid? QualityInspectionId { get; set; }
}

public class ProductionAttentionItemDto
{
    public string Reference { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Priority { get; set; } = "Normal";
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public Guid ReferenceId { get; set; }
    public string ActionType { get; set; } = "View";
}

public class RecentProductionOrderDto
{
    public Guid ReferenceId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal PlannedQuantity { get; set; }
    public decimal CompletedQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class RecentProductionExecutionDto
{
    public Guid ReferenceId { get; set; }
    public string ExecutionNumber { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public decimal ProducedQuantity { get; set; }
    public decimal RejectedQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
