using System;
using System.Collections.Generic;

namespace NovaERP.Application.Features.Reports.DTOs;

public class QualitySummaryDto
{
    public int PendingInspectionsCount { get; set; }
    public int InProgressInspectionsCount { get; set; }
    public int PassedInspectionsCount { get; set; }
    public int PartiallyPassedInspectionsCount { get; set; }
    public int FailedInspectionsCount { get; set; }
    public decimal TotalDefectsCount { get; set; }
    public decimal TotalAcceptedQuantity { get; set; }
    public decimal TotalRejectedQuantity { get; set; }

    public decimal PassRatePercentage { get; set; }
    public decimal FailureRatePercentage { get; set; }

    public Dictionary<string, int> StatusCounts { get; set; } = new();

    public List<QualityInspectionQueueDto> InspectionQueue { get; set; } = new();
    public List<QualityDefectAnalysisDto> DefectAnalysis { get; set; } = new();
    public List<QualityReleaseLogDto> ReleaseLog { get; set; } = new();
    public List<QualityAttentionItemDto> AttentionItems { get; set; } = new();
    public List<RecentQualityActivityDto> RecentActivity { get; set; } = new();
}

public class QualityInspectionQueueDto
{
    public Guid Id { get; set; }
    public string InspectionNumber { get; set; } = string.Empty;
    public string ProductionOrderNumber { get; set; } = string.Empty;
    public string ExecutionNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal InspectedQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string OutputWarehouseName { get; set; } = string.Empty;
}

public class QualityDefectAnalysisDto
{
    public string DefectCode { get; set; } = string.Empty;
    public string DefectName { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public decimal TotalQuantity { get; set; }
    public int OccurrenceCount { get; set; }
}

public class QualityReleaseLogDto
{
    public Guid InspectionId { get; set; }
    public string InspectionNumber { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ExecutionNumber { get; set; } = string.Empty;
    public decimal PassedQuantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? CompletedDate { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
}

public class QualityAttentionItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "medium";
    public string Type { get; set; } = string.Empty;
    public string LinkUrl { get; set; } = string.Empty;
}

public class RecentQualityActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string InspectionNumber { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
