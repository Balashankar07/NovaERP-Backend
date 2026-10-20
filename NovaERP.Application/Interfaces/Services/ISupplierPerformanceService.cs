using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NovaERP.Application.DTOs.SupplierPerformance;

namespace NovaERP.Application.Interfaces.Services;

public interface ISupplierPerformanceService
{
    Task<SupplierPerformanceOverviewDto> GetOverviewAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<List<SupplierPerformanceSummaryDto>> GetAllSupplierSummariesAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<SupplierPerformanceSummaryDto?> GetSupplierSummaryByIdAsync(Guid supplierId, DateTime? startDate = null, DateTime? endDate = null);
    Task<SupplierScorecardDetailDto?> GetSupplierScorecardByIdAsync(Guid supplierId, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<SupplierMonthlyPerformanceDto>> GetSupplierMonthlyHistoryAsync(Guid supplierId, int months = 12);

    Task<SupplierScorecardConfigDto> GetScorecardConfigAsync();
    Task<SupplierScorecardConfigDto> UpdateScorecardConfigAsync(UpdateSupplierScorecardConfigDto dto, Guid? userId = null);
}
