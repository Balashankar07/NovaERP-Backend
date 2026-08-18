using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Reports.DTOs;

namespace NovaERP.Application.Features.Reports.Interfaces;

public interface IReportService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken);
    Task<ProcurementSummaryDto> GetProcurementSummaryAsync(CancellationToken cancellationToken);
    Task<InventorySummaryDto> GetInventorySummaryAsync(CancellationToken cancellationToken);
    Task<PagedResult<InventoryReportDto>> GetInventoryReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken);
    Task<PagedResult<ProductionReportDto>> GetProductionReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken);
    Task<PagedResult<SalesReportDto>> GetSalesReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken);
    Task<PagedResult<WarrantyReportDto>> GetWarrantyReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken);
    Task<PagedResult<AuditReportDto>> GetAuditReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken);
}
