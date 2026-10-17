export interface SupplierPerformanceOverview {
  totalSuppliers: number;
  activeSuppliers: number;
  evaluatedSuppliers: number;
  averageOnTimeDeliveryRate: number;
  averageFillRate: number;
  averageQualityAcceptanceRate: number;
  totalSpend: number;
  totalPOCount: number;
  totalGRNCount: number;
  gradeDistribution: Record<string, number>;
}

export interface SupplierPerformanceSummary {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isActive: boolean;

  totalPOCount: number;
  totalGRNCount: number;
  totalOrderedQuantity: number;
  totalReceivedQuantity: number;
  totalRejectedQuantity: number;
  totalAcceptedQuantity: number;
  totalSpend: number;

  // Delivery
  onTimeDeliveryRate?: number;
  averageDelayDays?: number;
  lateDeliveryCount: number;
  earlyOrOnTimeDeliveryCount: number;

  // Fulfillment
  fillRate?: number;

  // Quality
  qualityAcceptanceRate?: number;
  defectRate?: number;

  // Commercial
  averageUnitPrice?: number;
  catalogPriceVariancePercent?: number;
  commercialVarianceStatus: string;

  // Scorecard
  finalScore?: number;
  grade: string;
  dataCoverageStatus: string;
}

export interface ScorecardMetricDetail {
  metricCategory: string;
  metricName: string;
  rawValue?: number;
  rawValueFormatted: string;
  normalizedScore?: number;
  weightPercent: number;
  weightedContribution?: number;
  dataCoverage: string;
  formulaDescription: string;
}

export interface SupplierScorecardDetail {
  summary: SupplierPerformanceSummary;
  calculationPeriodStart?: string;
  calculationPeriodEnd?: string;
  calculatedAt: string;
  metricsBreakdown: ScorecardMetricDetail[];
  formulaExplanation: string;
}

export interface SupplierMonthlyPerformance {
  year: number;
  month: number;
  monthName: string;
  poCount: number;
  grnCount: number;
  purchaseValue: number;
  orderedQuantity: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  onTimeDeliveryRate?: number;
  fillRate?: number;
  qualityAcceptanceRate?: number;
}

export interface SupplierScorecardConfig {
  id: string;
  deliveryWeight: number;
  fulfillmentWeight: number;
  qualityWeight: number;
  commercialWeight: number;

  gradeAThreshold: number;
  gradeBThreshold: number;
  gradeCThreshold: number;

  notes?: string;
  updatedAt?: string;
}

export interface UpdateSupplierScorecardConfigDto {
  deliveryWeight: number;
  fulfillmentWeight: number;
  qualityWeight: number;
  commercialWeight: number;

  gradeAThreshold: number;
  gradeBThreshold: number;
  gradeCThreshold: number;

  notes?: string;
}
