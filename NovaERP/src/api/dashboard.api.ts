import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "./endpoints";
import { 
  DashboardSummaryDto, 
  InventoryReportDto, 
  ProductionReportDto, 
  SalesReportDto, 
  WarrantyReportDto, 
  AuditReportDto,
  ProcurementSummaryDto,
  InventorySummaryDto
} from "@/types/reports.types";
import { PaginatedResponse, PaginationParams } from "@/types/api.types";

export const dashboardApi = {
  getSummary: () => 
    api.get<DashboardSummaryDto>(API_ENDPOINTS.REPORTS.DASHBOARD),

  getProcurementSummary: () =>
    api.get<ProcurementSummaryDto>(API_ENDPOINTS.REPORTS.PROCUREMENT),

  getInventorySummary: () =>
    api.get<InventorySummaryDto>(API_ENDPOINTS.REPORTS.INVENTORY_SUMMARY),

  getInventoryReport: (params?: PaginationParams) => 
    api.get<PaginatedResponse<InventoryReportDto>>(API_ENDPOINTS.REPORTS.INVENTORY, { params }),

  getProductionReport: (params?: PaginationParams) => 
    api.get<PaginatedResponse<ProductionReportDto>>(API_ENDPOINTS.REPORTS.PRODUCTION, { params }),

  getSalesReport: (params?: PaginationParams) => 
    api.get<PaginatedResponse<SalesReportDto>>(API_ENDPOINTS.REPORTS.SALES, { params }),

  getWarrantyReport: (params?: PaginationParams) => 
    api.get<PaginatedResponse<WarrantyReportDto>>(API_ENDPOINTS.REPORTS.WARRANTY, { params }),

  getAuditReport: (params?: PaginationParams) => 
    api.get<PaginatedResponse<AuditReportDto>>(API_ENDPOINTS.REPORTS.AUDIT, { params }),
};
