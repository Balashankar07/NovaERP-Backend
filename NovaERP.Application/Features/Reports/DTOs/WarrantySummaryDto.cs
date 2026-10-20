using System;
using System.Collections.Generic;

namespace NovaERP.Application.Features.Reports.DTOs;

public class WarrantySummaryDto
{
    public int ActiveWarranties { get; set; }
    public int ExpiringWarranties { get; set; }
    public int ActiveClaims { get; set; }
    public int PendingClaims { get; set; }
    public int UnderReviewClaims { get; set; }
    public int ApprovedClaims { get; set; }
    public int ResolvedClaims { get; set; }
    public int RejectedClaims { get; set; }
    public int ClosedClaims { get; set; }
    public int TotalClaims { get; set; }
    public double AverageResolutionDays { get; set; }

    public Dictionary<string, int> ClaimPipeline { get; set; } = new();

    public List<ExpiringWarrantyQueueItemDto> ExpiringQueue { get; set; } = new();
    public List<WarrantyClaimQueueItemDto> ClaimQueue { get; set; } = new();
    public List<WarrantyCoverageItemDto> CoverageOverview { get; set; } = new();
    public List<WarrantyAttentionItemDto> AttentionItems { get; set; } = new();
    public List<WarrantyRecentActivityDto> RecentActivity { get; set; } = new();
}

public class ExpiringWarrantyQueueItemDto
{
    public Guid WarrantyId { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string WarrantyType { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public Guid ShipmentId { get; set; }
    public string ShipmentNumber { get; set; } = string.Empty;
    public string SalesOrderNumber { get; set; } = string.Empty;
    public string DistributorName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DaysRemaining { get; set; }
    public int ActiveClaimCount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class WarrantyClaimQueueItemDto
{
    public Guid ClaimId { get; set; }
    public Guid WarrantyId { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public string DistributorName { get; set; } = string.Empty;
    public string SalesOrderNumber { get; set; } = string.Empty;
    public string ShipmentNumber { get; set; } = string.Empty;
    public DateTime RequestDate { get; set; }
    public string Complaint { get; set; } = string.Empty;
    public string? Resolution { get; set; }
    public string Status { get; set; } = string.Empty;
    public string WarrantyType { get; set; } = string.Empty;
    public DateTime WarrantyEndDate { get; set; }
}

public class WarrantyCoverageItemDto
{
    public Guid WarrantyId { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string WarrantyType { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public string DistributorName { get; set; } = string.Empty;
    public string SalesOrderNumber { get; set; } = string.Empty;
    public string ShipmentNumber { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DaysRemaining { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalClaims { get; set; }
}

public class WarrantyAttentionItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty; // high, medium, low
    public string Type { get; set; } = string.Empty;
    public string LinkUrl { get; set; } = string.Empty;
}

public class WarrantyRecentActivityDto
{
    public Guid ClaimId { get; set; }
    public Guid WarrantyId { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string DistributorName { get; set; } = string.Empty;
    public string Complaint { get; set; } = string.Empty;
    public string? Resolution { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime ActivityDate { get; set; }
}
