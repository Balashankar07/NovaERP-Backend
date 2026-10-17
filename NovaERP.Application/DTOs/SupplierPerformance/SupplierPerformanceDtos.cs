using System;
using System.Collections.Generic;

namespace NovaERP.Application.DTOs.SupplierPerformance;

public class SupplierPerformanceOverviewDto
{
    public int TotalSuppliers { get; set; }
    public int ActiveSuppliers { get; set; }
    public int EvaluatedSuppliers { get; set; }
    public decimal AverageOnTimeDeliveryRate { get; set; }
    public decimal AverageFillRate { get; set; }
    public decimal AverageQualityAcceptanceRate { get; set; }
    public decimal TotalSpend { get; set; }
    public int TotalPOCount { get; set; }
    public int TotalGRNCount { get; set; }
    public Dictionary<string, int> GradeDistribution { get; set; } = new();
}

public class SupplierPerformanceSummaryDto
{
    public Guid SupplierId { get; set; }
    public string SupplierCode { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; }

    public int TotalPOCount { get; set; }
    public int TotalGRNCount { get; set; }
    public decimal TotalOrderedQuantity { get; set; }
    public decimal TotalReceivedQuantity { get; set; }
    public decimal TotalRejectedQuantity { get; set; }
    public decimal TotalAcceptedQuantity { get; set; }
    public decimal TotalSpend { get; set; }

    // Delivery Performance
    public decimal? OnTimeDeliveryRate { get; set; }
    public decimal? AverageDelayDays { get; set; }
    public int LateDeliveryCount { get; set; }
    public int EarlyOrOnTimeDeliveryCount { get; set; }

    // Fulfillment Performance
    public decimal? FillRate { get; set; }

    // Quality Performance
    public decimal? QualityAcceptanceRate { get; set; }
    public decimal? DefectRate { get; set; }

    // Commercial Performance
    public decimal? AverageUnitPrice { get; set; }
    public decimal? CatalogPriceVariancePercent { get; set; }
    public string CommercialVarianceStatus { get; set; } = "CATALOG BASELINE";

    // Scorecard & Grade
    public decimal? FinalScore { get; set; }
    public string Grade { get; set; } = "INSUFFICIENT DATA";
    public string DataCoverageStatus { get; set; } = "SUFFICIENT DATA";
}

public class SupplierScorecardDetailDto
{
    public SupplierPerformanceSummaryDto Summary { get; set; } = null!;
    public DateTime? CalculationPeriodStart { get; set; }
    public DateTime? CalculationPeriodEnd { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;

    public List<ScorecardMetricDetailDto> MetricsBreakdown { get; set; } = new();
    public string FormulaExplanation { get; set; } = string.Empty;
}

public class ScorecardMetricDetailDto
{
    public string MetricCategory { get; set; } = string.Empty;
    public string MetricName { get; set; } = string.Empty;
    public decimal? RawValue { get; set; }
    public string RawValueFormatted { get; set; } = string.Empty;
    public decimal? NormalizedScore { get; set; }
    public decimal WeightPercent { get; set; }
    public decimal? WeightedContribution { get; set; }
    public string DataCoverage { get; set; } = "AVAILABLE";
    public string FormulaDescription { get; set; } = string.Empty;
}

public class SupplierMonthlyPerformanceDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;

    public int POCount { get; set; }
    public int GRNCount { get; set; }
    public decimal PurchaseValue { get; set; }

    public decimal OrderedQuantity { get; set; }
    public decimal ReceivedQuantity { get; set; }
    public decimal RejectedQuantity { get; set; }

    public decimal? OnTimeDeliveryRate { get; set; }
    public decimal? FillRate { get; set; }
    public decimal? QualityAcceptanceRate { get; set; }
}

public class SupplierScorecardConfigDto
{
    public Guid Id { get; set; }
    public decimal DeliveryWeight { get; set; } = 30.00m;
    public decimal FulfillmentWeight { get; set; } = 25.00m;
    public decimal QualityWeight { get; set; } = 30.00m;
    public decimal CommercialWeight { get; set; } = 15.00m;

    public decimal GradeAThreshold { get; set; } = 90.00m;
    public decimal GradeBThreshold { get; set; } = 75.00m;
    public decimal GradeCThreshold { get; set; } = 60.00m;

    public string Notes { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateSupplierScorecardConfigDto
{
    public decimal DeliveryWeight { get; set; }
    public decimal FulfillmentWeight { get; set; }
    public decimal QualityWeight { get; set; }
    public decimal CommercialWeight { get; set; }

    public decimal GradeAThreshold { get; set; }
    public decimal GradeBThreshold { get; set; }
    public decimal GradeCThreshold { get; set; }

    public string? Notes { get; set; }
}
