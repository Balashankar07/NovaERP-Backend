using System;
using System.Collections.Generic;

namespace NovaERP.Application.Features.Reports.DTOs;

public class SalesSummaryDto
{
    public int DraftOrdersCount { get; set; }
    public int PendingApprovalCount { get; set; }
    public int ApprovedOrdersCount { get; set; }
    public int ReservedOrdersCount { get; set; }
    public int ReadyToShipCount { get; set; }
    public int PartiallyShippedCount { get; set; }
    public int CompletedOrdersCount { get; set; }
    public decimal AvailableFinishedGoodsQuantity { get; set; }

    public int OpenOrdersCount { get; set; }
    public int ActiveReservationsCount { get; set; }
    public decimal TotalSalesValue { get; set; }
    public decimal CompletedSalesValue { get; set; }
    public decimal OpenSalesValue { get; set; }

    public Dictionary<string, int> StatusCounts { get; set; } = new();

    public List<FinishedGoodsAvailabilityDto> FinishedGoodsAvailability { get; set; } = new();
    public List<ActiveReservationDto> ActiveReservations { get; set; } = new();
    public List<ReadyToShipOrderDto> ReadyToShipOrders { get; set; } = new();
    public List<DistributorActivityDto> TopDistributors { get; set; } = new();
    public List<SalesAttentionItemDto> AttentionItems { get; set; } = new();
    public List<RecentSalesActivityDto> RecentActivity { get; set; } = new();
}

public class FinishedGoodsAvailabilityDto
{
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal QuantityOnHand { get; set; }
    public decimal QuantityReserved { get; set; }
    public decimal QuantityAvailable { get; set; }
    public decimal UnitPrice { get; set; }
}

public class ActiveReservationDto
{
    public Guid ReservationId { get; set; }
    public string SalesOrderNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal ReservedQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public class ReadyToShipOrderDto
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string DistributorName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal OrderedQuantity { get; set; }
    public decimal ReservedQuantity { get; set; }
    public decimal ShippedQuantity { get; set; }
    public decimal RemainingQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
}

public class DistributorActivityDto
{
    public Guid DistributorId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public int TotalOrders { get; set; }
    public decimal TotalOrderValue { get; set; }
    public string ContactPerson { get; set; } = string.Empty;
}

public class SalesAttentionItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "medium";
    public string Type { get; set; } = string.Empty;
    public string LinkUrl { get; set; } = string.Empty;
}

public class RecentSalesActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string DistributorName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
