import { api } from "@/lib/api-helper";
import {
  SupplierPerformanceOverview,
  SupplierPerformanceSummary,
  SupplierScorecardDetail,
  SupplierMonthlyPerformance,
  SupplierScorecardConfig,
  UpdateSupplierScorecardConfigDto,
} from "@/types/supplierPerformance.types";

export const supplierPerformanceApi = {
  getOverview: (startDate?: string, endDate?: string): Promise<SupplierPerformanceOverview> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return api.get<SupplierPerformanceOverview>(`/SupplierPerformance/overview?${params.toString()}`);
  },

  getAllSummaries: (startDate?: string, endDate?: string): Promise<SupplierPerformanceSummary[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return api.get<SupplierPerformanceSummary[]>(`/SupplierPerformance/suppliers?${params.toString()}`);
  },

  getSupplierSummary: (supplierId: string, startDate?: string, endDate?: string): Promise<SupplierPerformanceSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return api.get<SupplierPerformanceSummary>(`/SupplierPerformance/suppliers/${supplierId}?${params.toString()}`);
  },

  getScorecardDetail: (supplierId: string, startDate?: string, endDate?: string): Promise<SupplierScorecardDetail> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return api.get<SupplierScorecardDetail>(`/SupplierPerformance/suppliers/${supplierId}/scorecard?${params.toString()}`);
  },

  getMonthlyHistory: (supplierId: string, months: number = 12): Promise<SupplierMonthlyPerformance[]> => {
    return api.get<SupplierMonthlyPerformance[]>(`/SupplierPerformance/suppliers/${supplierId}/history?months=${months}`);
  },

  getConfig: (): Promise<SupplierScorecardConfig> => {
    return api.get<SupplierScorecardConfig>("/SupplierPerformance/config");
  },

  updateConfig: (dto: UpdateSupplierScorecardConfigDto): Promise<SupplierScorecardConfig> => {
    return api.put<SupplierScorecardConfig>("/SupplierPerformance/config", dto);
  },
};
