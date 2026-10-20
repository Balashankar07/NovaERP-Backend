using System;
using System.Collections.Generic;

namespace NovaERP.Application.Features.Reports.DTOs;

public class DistributionSummaryDto
{
    public int ReadyToShipOrders { get; set; }
    public int DraftShipments { get; set; }
    public int ShipmentsReadyForDispatch { get; set; }
    public int PartiallyShippedOrders { get; set; }
    public int DispatchedShipments { get; set; }
    public int CompletedOrders { get; set; }
    public decimal UnitsAwaitingDispatch { get; set; }
    public decimal TotalShipmentFulfillmentValue { get; set; }

    public Dictionary<string, int> ShipmentPipeline { get; set; } = new();

    public List<ReadyToShipQueueItemDto> ReadyToShipQueue { get; set; } = new();
    public List<DistributionInventoryVisibilityDto> InventoryVisibility { get; set; } = new();
    public List<DistributionAttentionItemDto> AttentionItems { get; set; } = new();
    public List<RecentDispatchActivityDto> RecentDispatches { get; set; } = new();
}

public class ReadyToShipQueueItemDto
{
    public Guid SalesOrderId { get; set; }
    public string SalesOrderNumber { get; set; } = string.Empty;
    public string DistributorName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public DateTime? RequiredDeliveryDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal OrderedQuantity { get; set; }
    public decimal ReservedQuantity { get; set; }
    public decimal ShippedQuantity { get; set; }
    public decimal RemainingQuantity { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
}

public class DistributionInventoryVisibilityDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public decimal QuantityOnHand { get; set; }
    public decimal QuantityReserved { get; set; }
    public decimal QuantityAvailable { get; set; }
    public bool IsLowStock { get; set; }
}

public class DistributionAttentionItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty; // high, medium, low
    public string Type { get; set; } = string.Empty;
    public string LinkUrl { get; set; } = string.Empty;
}

public class RecentDispatchActivityDto
{
    public Guid ShipmentId { get; set; }
    public string ShipmentNumber { get; set; } = string.Empty;
    public string SalesOrderNumber { get; set; } = string.Empty;
    public string DistributorName { get; set; } = string.Empty;
    public string CourierName { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public DateTime? DispatchDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
