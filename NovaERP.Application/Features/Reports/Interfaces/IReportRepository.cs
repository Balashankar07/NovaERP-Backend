using NovaERP.Application.Features.Reports.DTOs;

namespace NovaERP.Application.Features.Reports.Interfaces;

public interface IReportRepository
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(Guid companyId, CancellationToken cancellationToken);
    Task<ProcurementSummaryDto> GetProcurementSummaryAsync(Guid companyId, CancellationToken cancellationToken);
    Task<InventorySummaryDto> GetInventorySummaryAsync(Guid companyId, CancellationToken cancellationToken);
    IQueryable<InventoryReportDto> GetInventoryReportQuery(Guid companyId);
    IQueryable<ProductionReportDto> GetProductionReportQuery(Guid companyId);
    IQueryable<SalesReportDto> GetSalesReportQuery(Guid companyId);
    IQueryable<WarrantyReportDto> GetWarrantyReportQuery(Guid companyId);
    IQueryable<AuditReportDto> GetAuditReportQuery(Guid companyId);
}
