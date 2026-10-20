using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NovaERP.Application.DTOs.SupplierPerformance;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class SupplierPerformanceService : ISupplierPerformanceService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;

    public SupplierPerformanceService(AppDbContext context, IAuditLogger auditLogger)
    {
        _context = context;
        _auditLogger = auditLogger;
    }

    public async Task<SupplierPerformanceOverviewDto> GetOverviewAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var summaries = await GetAllSupplierSummariesAsync(startDate, endDate);

        var overview = new SupplierPerformanceOverviewDto
        {
            TotalSuppliers = await _context.Suppliers.CountAsync(),
            ActiveSuppliers = await _context.Suppliers.CountAsync(s => s.IsActive),
            EvaluatedSuppliers = summaries.Count(s => s.DataCoverageStatus == "SUFFICIENT DATA"),
            TotalSpend = summaries.Sum(s => s.TotalSpend),
            TotalPOCount = summaries.Sum(s => s.TotalPOCount),
            TotalGRNCount = summaries.Sum(s => s.TotalGRNCount),
        };

        var evaluatedWithDelivery = summaries.Where(s => s.OnTimeDeliveryRate.HasValue).ToList();
        overview.AverageOnTimeDeliveryRate = evaluatedWithDelivery.Any()
            ? Math.Round(evaluatedWithDelivery.Average(s => s.OnTimeDeliveryRate!.Value), 2)
            : 0;

        var evaluatedWithFill = summaries.Where(s => s.FillRate.HasValue).ToList();
        overview.AverageFillRate = evaluatedWithFill.Any()
            ? Math.Round(evaluatedWithFill.Average(s => s.FillRate!.Value), 2)
            : 0;

        var evaluatedWithQuality = summaries.Where(s => s.QualityAcceptanceRate.HasValue).ToList();
        overview.AverageQualityAcceptanceRate = evaluatedWithQuality.Any()
            ? Math.Round(evaluatedWithQuality.Average(s => s.QualityAcceptanceRate!.Value), 2)
            : 0;

        overview.GradeDistribution = summaries
            .GroupBy(s => s.Grade)
            .ToDictionary(g => g.Key, g => g.Count());

        return overview;
    }

    public async Task<List<SupplierPerformanceSummaryDto>> GetAllSupplierSummariesAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var suppliers = await _context.Suppliers
            .AsNoTracking()
            .Where(s => s.IsActive)
            .ToListAsync();

        var config = await GetScorecardConfigEntityAsync();
        var results = new List<SupplierPerformanceSummaryDto>();

        foreach (var supplier in suppliers)
        {
            var summary = await CalculateSupplierMetricsAsync(supplier, config, startDate, endDate);
            results.Add(summary);
        }

        return results.OrderByDescending(r => r.FinalScore ?? -1).ToList();
    }

    public async Task<SupplierPerformanceSummaryDto?> GetSupplierSummaryByIdAsync(Guid supplierId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var supplier = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(s => s.Id == supplierId);
        if (supplier == null) return null;

        var config = await GetScorecardConfigEntityAsync();
        return await CalculateSupplierMetricsAsync(supplier, config, startDate, endDate);
    }

    public async Task<SupplierScorecardDetailDto?> GetSupplierScorecardByIdAsync(Guid supplierId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var summary = await GetSupplierSummaryByIdAsync(supplierId, startDate, endDate);
        if (summary == null) return null;

        var config = await GetScorecardConfigEntityAsync();

        var detail = new SupplierScorecardDetailDto
        {
            Summary = summary,
            CalculationPeriodStart = startDate,
            CalculationPeriodEnd = endDate,
            CalculatedAt = DateTime.UtcNow,
            FormulaExplanation = $"Final Score = (Delivery * {config.DeliveryWeight}%) + (Fulfillment * {config.FulfillmentWeight}%) + (Quality * {config.QualityWeight}%) + (Commercial * {config.CommercialWeight}%). Evaluated deterministically against real POs, GRNs, and Quality rejections."
        };

        // 1. Delivery Metric
        detail.MetricsBreakdown.Add(new ScorecardMetricDetailDto
        {
            MetricCategory = "Delivery Performance",
            MetricName = "On-Time Delivery Rate",
            RawValue = summary.OnTimeDeliveryRate,
            RawValueFormatted = summary.OnTimeDeliveryRate.HasValue ? $"{summary.OnTimeDeliveryRate:F1}%" : "N/A",
            NormalizedScore = summary.OnTimeDeliveryRate,
            WeightPercent = config.DeliveryWeight,
            WeightedContribution = summary.OnTimeDeliveryRate.HasValue ? Math.Round(summary.OnTimeDeliveryRate.Value * (config.DeliveryWeight / 100m), 2) : null,
            DataCoverage = summary.TotalGRNCount > 0 ? "AVAILABLE" : "INSUFFICIENT DATA / NO GRN",
            FormulaDescription = "Percentage of Goods Receipts delivered on or before PO Expected Delivery Date."
        });

        // 2. Fulfillment Metric
        detail.MetricsBreakdown.Add(new ScorecardMetricDetailDto
        {
            MetricCategory = "Fulfillment Performance",
            MetricName = "Order Fill Rate",
            RawValue = summary.FillRate,
            RawValueFormatted = summary.FillRate.HasValue ? $"{summary.FillRate:F1}%" : "N/A",
            NormalizedScore = summary.FillRate,
            WeightPercent = config.FulfillmentWeight,
            WeightedContribution = summary.FillRate.HasValue ? Math.Round(summary.FillRate.Value * (config.FulfillmentWeight / 100m), 2) : null,
            DataCoverage = summary.TotalPOCount > 0 ? "AVAILABLE" : "INSUFFICIENT DATA / NO PO",
            FormulaDescription = "Ratio of total received product quantity vs. total ordered quantity across all POs."
        });

        // 3. Quality Metric
        detail.MetricsBreakdown.Add(new ScorecardMetricDetailDto
        {
            MetricCategory = "Quality Performance",
            MetricName = "Quality Acceptance Rate",
            RawValue = summary.QualityAcceptanceRate,
            RawValueFormatted = summary.QualityAcceptanceRate.HasValue ? $"{summary.QualityAcceptanceRate:F1}%" : "N/A",
            NormalizedScore = summary.QualityAcceptanceRate,
            WeightPercent = config.QualityWeight,
            WeightedContribution = summary.QualityAcceptanceRate.HasValue ? Math.Round(summary.QualityAcceptanceRate.Value * (config.QualityWeight / 100m), 2) : null,
            DataCoverage = summary.TotalReceivedQuantity > 0 ? "AVAILABLE" : "NOT AVAILABLE / NO GRN",
            FormulaDescription = "Percentage of received goods accepted following inbound warehouse receiving and defect inspections."
        });

        // 4. Commercial Metric
        decimal? commercialNormalized = summary.CatalogPriceVariancePercent.HasValue
            ? Math.Max(0m, 100m - Math.Max(0m, summary.CatalogPriceVariancePercent.Value))
            : (summary.TotalPOCount > 0 ? 100m : null);

        detail.MetricsBreakdown.Add(new ScorecardMetricDetailDto
        {
            MetricCategory = "Commercial Performance",
            MetricName = "Catalog Price Variance & Spend",
            RawValue = summary.CatalogPriceVariancePercent,
            RawValueFormatted = summary.CatalogPriceVariancePercent.HasValue
                ? $"{summary.CatalogPriceVariancePercent:+0.0;-0.0;0.0}% vs Catalog"
                : (summary.TotalPOCount > 0 ? "100% Catalog Match" : "N/A"),
            NormalizedScore = commercialNormalized,
            WeightPercent = config.CommercialWeight,
            WeightedContribution = commercialNormalized.HasValue ? Math.Round(commercialNormalized.Value * (config.CommercialWeight / 100m), 2) : null,
            DataCoverage = summary.TotalPOCount > 0 ? "AVAILABLE" : "INSUFFICIENT DATA",
            FormulaDescription = "PO purchase price compliance compared against agreed Supplier-Product catalog unit prices."
        });

        return detail;
    }

    public async Task<List<SupplierMonthlyPerformanceDto>> GetSupplierMonthlyHistoryAsync(Guid supplierId, int months = 12)
    {
        var cutoffDate = DateTime.UtcNow.AddMonths(-months).Date;

        var pos = await _context.PurchaseOrders
            .AsNoTracking()
            .Include(p => p.Items)
            .Where(p => p.SupplierId == supplierId && p.OrderDate >= cutoffDate && p.Status != PurchaseOrderStatus.Cancelled)
            .ToListAsync();

        var grns = await _context.GoodsReceipts
            .AsNoTracking()
            .Include(g => g.Items)
            .Include(g => g.PurchaseOrder)
            .Where(g => g.SupplierId == supplierId && g.ReceiptDate >= cutoffDate && g.Status != GoodsReceiptStatus.Cancelled)
            .ToListAsync();

        var monthlyMap = new List<SupplierMonthlyPerformanceDto>();

        for (int i = months - 1; i >= 0; i--)
        {
            var monthDate = DateTime.UtcNow.AddMonths(-i);
            int year = monthDate.Year;
            int month = monthDate.Month;

            var monthPOs = pos.Where(p => p.OrderDate.Year == year && p.OrderDate.Month == month).ToList();
            var monthGRNs = grns.Where(g => g.ReceiptDate.Year == year && g.ReceiptDate.Month == month).ToList();

            decimal orderedQty = monthPOs.SelectMany(p => p.Items).Sum(item => item.Quantity);
            decimal receivedQty = monthGRNs.SelectMany(g => g.Items).Sum(item => item.ReceivedQuantity);
            decimal rejectedQty = monthGRNs.SelectMany(g => g.Items).Sum(item => item.RejectedQuantity);
            decimal acceptedQty = Math.Max(0, receivedQty - rejectedQty);

            int onTimeCount = 0;
            foreach (var grn in monthGRNs)
            {
                var expected = grn.PurchaseOrder?.ExpectedDeliveryDate ?? grn.ReceiptDate;
                if (grn.ReceiptDate.Date <= expected.Date)
                {
                    onTimeCount++;
                }
            }

            decimal? onTimeRate = monthGRNs.Any() ? Math.Round((decimal)onTimeCount / monthGRNs.Count * 100m, 1) : null;
            decimal? fillRate = orderedQty > 0 ? Math.Round(Math.Min(100m, (receivedQty / orderedQty) * 100m), 1) : null;
            decimal? qualityRate = receivedQty > 0 ? Math.Round((acceptedQty / receivedQty) * 100m, 1) : null;

            monthlyMap.Add(new SupplierMonthlyPerformanceDto
            {
                Year = year,
                Month = month,
                MonthName = monthDate.ToString("MMM yyyy"),
                POCount = monthPOs.Count,
                GRNCount = monthGRNs.Count,
                PurchaseValue = monthPOs.Sum(p => p.TotalAmount),
                OrderedQuantity = orderedQty,
                ReceivedQuantity = receivedQty,
                RejectedQuantity = rejectedQty,
                OnTimeDeliveryRate = onTimeRate,
                FillRate = fillRate,
                QualityAcceptanceRate = qualityRate
            });
        }

        return monthlyMap;
    }

    public async Task<SupplierScorecardConfigDto> GetScorecardConfigAsync()
    {
        var config = await GetScorecardConfigEntityAsync();
        return MapToConfigDto(config);
    }

    public async Task<SupplierScorecardConfigDto> UpdateScorecardConfigAsync(UpdateSupplierScorecardConfigDto dto, Guid? userId = null)
    {
        decimal totalWeight = dto.DeliveryWeight + dto.FulfillmentWeight + dto.QualityWeight + dto.CommercialWeight;
        if (Math.Abs(totalWeight - 100.00m) > 0.01m)
        {
            throw new InvalidOperationException($"Scorecard weights must sum to exactly 100%. Provided total: {totalWeight}%");
        }

        var config = await GetScorecardConfigEntityAsync();
        config.DeliveryWeight = dto.DeliveryWeight;
        config.FulfillmentWeight = dto.FulfillmentWeight;
        config.QualityWeight = dto.QualityWeight;
        config.CommercialWeight = dto.CommercialWeight;
        config.GradeAThreshold = dto.GradeAThreshold;
        config.GradeBThreshold = dto.GradeBThreshold;
        config.GradeCThreshold = dto.GradeCThreshold;
        if (!string.IsNullOrWhiteSpace(dto.Notes)) config.Notes = dto.Notes;

        _context.SupplierScorecardConfigs.Update(config);
        await _context.SaveChangesAsync();

        if (userId.HasValue)
        {
            await _auditLogger.LogAsync(
                "UpdateScorecardConfig",
                "SupplierScorecardConfig",
                config.Id.ToString(),
                string.Empty,
                $"Updated Scorecard Weights: Delivery={dto.DeliveryWeight}%, Fulfillment={dto.FulfillmentWeight}%, Quality={dto.QualityWeight}%, Commercial={dto.CommercialWeight}%"
            );
        }

        return MapToConfigDto(config);
    }

    private async Task<SupplierScorecardConfig> GetScorecardConfigEntityAsync()
    {
        var config = await _context.SupplierScorecardConfigs.FirstOrDefaultAsync();
        if (config == null)
        {
            config = new SupplierScorecardConfig
            {
                DeliveryWeight = 30.00m,
                FulfillmentWeight = 25.00m,
                QualityWeight = 30.00m,
                CommercialWeight = 15.00m,
                GradeAThreshold = 90.00m,
                GradeBThreshold = 75.00m,
                GradeCThreshold = 60.00m,
                Notes = "Default Deterministic Scorecard Weights"
            };
            _context.SupplierScorecardConfigs.Add(config);
            await _context.SaveChangesAsync();
        }
        return config;
    }

    private async Task<SupplierPerformanceSummaryDto> CalculateSupplierMetricsAsync(
        Supplier supplier,
        SupplierScorecardConfig config,
        DateTime? startDate,
        DateTime? endDate)
    {
        var poQuery = _context.PurchaseOrders
            .AsNoTracking()
            .Include(p => p.Items)
            .Where(p => p.SupplierId == supplier.Id && p.Status != PurchaseOrderStatus.Cancelled);

        var grnQuery = _context.GoodsReceipts
            .AsNoTracking()
            .Include(g => g.Items)
            .Include(g => g.PurchaseOrder)
            .Where(g => g.SupplierId == supplier.Id && g.Status != GoodsReceiptStatus.Cancelled);

        if (startDate.HasValue)
        {
            poQuery = poQuery.Where(p => p.OrderDate >= startDate.Value);
            grnQuery = grnQuery.Where(g => g.ReceiptDate >= startDate.Value);
        }
        if (endDate.HasValue)
        {
            poQuery = poQuery.Where(p => p.OrderDate <= endDate.Value);
            grnQuery = grnQuery.Where(g => g.ReceiptDate <= endDate.Value);
        }

        var pos = await poQuery.ToListAsync();
        var grns = await grnQuery.ToListAsync();

        int poCount = pos.Count;
        int grnCount = grns.Count;

        decimal totalOrdered = pos.SelectMany(p => p.Items).Sum(i => i.Quantity);
        decimal totalReceived = grns.SelectMany(g => g.Items).Sum(i => i.ReceivedQuantity);
        decimal totalRejected = grns.SelectMany(g => g.Items).Sum(i => i.RejectedQuantity);
        decimal totalAccepted = Math.Max(0, totalReceived - totalRejected);
        decimal totalSpend = pos.Sum(p => p.TotalAmount);

        // 1. Delivery Performance
        decimal? onTimeRate = null;
        decimal? avgDelay = null;
        int lateCount = 0;
        int onTimeCount = 0;

        if (grnCount > 0)
        {
            double totalDelayDays = 0;
            foreach (var grn in grns)
            {
                var expected = grn.PurchaseOrder?.ExpectedDeliveryDate ?? grn.ReceiptDate;
                if (grn.ReceiptDate.Date <= expected.Date)
                {
                    onTimeCount++;
                }
                else
                {
                    lateCount++;
                    totalDelayDays += (grn.ReceiptDate.Date - expected.Date).TotalDays;
                }
            }
            onTimeRate = Math.Round((decimal)onTimeCount / grnCount * 100m, 1);
            avgDelay = lateCount > 0 ? Math.Round((decimal)(totalDelayDays / lateCount), 1) : 0m;
        }

        // 2. Fulfillment Performance
        decimal? fillRate = null;
        if (totalOrdered > 0)
        {
            fillRate = Math.Round(Math.Min(100m, (totalReceived / totalOrdered) * 100m), 1);
        }

        // 3. Quality Performance
        decimal? qualityRate = null;
        decimal? defectRate = null;
        if (totalReceived > 0)
        {
            qualityRate = Math.Round((totalAccepted / totalReceived) * 100m, 1);
            defectRate = Math.Round((totalRejected / totalReceived) * 100m, 1);
        }

        // 4. Commercial Performance
        decimal? avgUnitPrice = null;
        decimal? priceVariance = null;
        var poItems = pos.SelectMany(p => p.Items).ToList();
        if (poItems.Any() && totalOrdered > 0)
        {
            avgUnitPrice = Math.Round(poItems.Sum(i => i.LineTotal) / totalOrdered, 2);

            var supplierProducts = await _context.SupplierProducts
                .AsNoTracking()
                .Where(sp => sp.SupplierId == supplier.Id && sp.IsActive)
                .ToListAsync();

            if (supplierProducts.Any())
            {
                decimal avgCatalogPrice = supplierProducts.Average(sp => sp.UnitPrice);
                if (avgCatalogPrice > 0 && avgUnitPrice.HasValue)
                {
                    priceVariance = Math.Round(((avgUnitPrice.Value - avgCatalogPrice) / avgCatalogPrice) * 100m, 1);
                }
            }
        }

        // 5. Scorecard & Grade Calculation
        decimal weightedSum = 0m;
        decimal totalWeightsUsed = 0m;

        if (onTimeRate.HasValue)
        {
            weightedSum += onTimeRate.Value * (config.DeliveryWeight / 100m);
            totalWeightsUsed += (config.DeliveryWeight / 100m);
        }
        if (fillRate.HasValue)
        {
            weightedSum += fillRate.Value * (config.FulfillmentWeight / 100m);
            totalWeightsUsed += (config.FulfillmentWeight / 100m);
        }
        if (qualityRate.HasValue)
        {
            weightedSum += qualityRate.Value * (config.QualityWeight / 100m);
            totalWeightsUsed += (config.QualityWeight / 100m);
        }
        if (poCount > 0)
        {
            decimal commScore = priceVariance.HasValue ? Math.Max(0m, 100m - Math.Max(0m, priceVariance.Value)) : 100m;
            weightedSum += commScore * (config.CommercialWeight / 100m);
            totalWeightsUsed += (config.CommercialWeight / 100m);
        }

        decimal? finalScore = null;
        string grade = "INSUFFICIENT DATA";
        string coverage = "INSUFFICIENT DATA";

        if (poCount == 0 && grnCount == 0)
        {
            coverage = "NO PO HISTORY";
        }
        else if (grnCount == 0)
        {
            coverage = "PO EXISTS / NO GRN";
        }

        if (totalWeightsUsed > 0 && (poCount > 0 || grnCount > 0))
        {
            finalScore = Math.Round(weightedSum / totalWeightsUsed, 1);
            coverage = "SUFFICIENT DATA";

            if (finalScore >= config.GradeAThreshold) grade = "Grade A - Excellent";
            else if (finalScore >= config.GradeBThreshold) grade = "Grade B - Good";
            else if (finalScore >= config.GradeCThreshold) grade = "Grade C - Satisfactory";
            else grade = "Grade D - Needs Attention";
        }

        return new SupplierPerformanceSummaryDto
        {
            SupplierId = supplier.Id,
            SupplierCode = supplier.SupplierCode,
            SupplierName = supplier.SupplierName,
            ContactPerson = supplier.ContactPerson,
            Email = supplier.Email,
            Phone = supplier.Phone,
            IsActive = supplier.IsActive,

            TotalPOCount = poCount,
            TotalGRNCount = grnCount,
            TotalOrderedQuantity = totalOrdered,
            TotalReceivedQuantity = totalReceived,
            TotalRejectedQuantity = totalRejected,
            TotalAcceptedQuantity = totalAccepted,
            TotalSpend = totalSpend,

            OnTimeDeliveryRate = onTimeRate,
            AverageDelayDays = avgDelay,
            LateDeliveryCount = lateCount,
            EarlyOrOnTimeDeliveryCount = onTimeCount,

            FillRate = fillRate,
            QualityAcceptanceRate = qualityRate,
            DefectRate = defectRate,

            AverageUnitPrice = avgUnitPrice,
            CatalogPriceVariancePercent = priceVariance,
            CommercialVarianceStatus = priceVariance.HasValue ? (priceVariance > 0 ? "ABOVE CATALOG" : "AT OR BELOW CATALOG") : "CATALOG BASELINE",

            FinalScore = finalScore,
            Grade = grade,
            DataCoverageStatus = coverage
        };
    }

    private static SupplierScorecardConfigDto MapToConfigDto(SupplierScorecardConfig config)
    {
        return new SupplierScorecardConfigDto
        {
            Id = config.Id,
            DeliveryWeight = config.DeliveryWeight,
            FulfillmentWeight = config.FulfillmentWeight,
            QualityWeight = config.QualityWeight,
            CommercialWeight = config.CommercialWeight,
            GradeAThreshold = config.GradeAThreshold,
            GradeBThreshold = config.GradeBThreshold,
            GradeCThreshold = config.GradeCThreshold,
            Notes = config.Notes,
            UpdatedAt = config.UpdatedAt
        };
    }
}
