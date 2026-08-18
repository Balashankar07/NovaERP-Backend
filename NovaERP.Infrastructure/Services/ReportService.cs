using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Reports.DTOs;
using NovaERP.Application.Features.Reports.Interfaces;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly IReportRepository _repository;
    private readonly ICurrentUserService _currentUserService;

    public ReportService(IReportRepository repository, ICurrentUserService currentUserService)
    {
        _repository = repository;
        _currentUserService = currentUserService;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken)
    {
        return await _repository.GetDashboardSummaryAsync(_currentUserService.CompanyId, cancellationToken);
    }

    public async Task<InventorySummaryDto> GetInventorySummaryAsync(CancellationToken cancellationToken)
    {
        return await _repository.GetInventorySummaryAsync(_currentUserService.CompanyId, cancellationToken);
    }

    public async Task<ProcurementSummaryDto> GetProcurementSummaryAsync(CancellationToken cancellationToken)
    {
        return await _repository.GetProcurementSummaryAsync(_currentUserService.CompanyId, cancellationToken);
    }

    public async Task<PagedResult<InventoryReportDto>> GetInventoryReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken)
    {
        var query = _repository.GetInventoryReportQuery(_currentUserService.CompanyId);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(x => x.ProductName.Contains(searchTerm) || x.ProductCode.Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            query = sortBy.ToLower() switch
            {
                "productcode" => sortDescending ? query.OrderByDescending(x => x.ProductCode) : query.OrderBy(x => x.ProductCode),
                "quantityonhand" => sortDescending ? query.OrderByDescending(x => x.QuantityOnHand) : query.OrderBy(x => x.QuantityOnHand),
                "totalvalue" => sortDescending ? query.OrderByDescending(x => x.TotalValue) : query.OrderBy(x => x.TotalValue),
                _ => sortDescending ? query.OrderByDescending(x => x.ProductName) : query.OrderBy(x => x.ProductName),
            };
        }
        else
        {
            query = query.OrderBy(x => x.ProductName);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedResult<InventoryReportDto> { Items = items, TotalCount = totalCount, PageNumber = pageNumber, PageSize = pageSize };
    }

    public async Task<PagedResult<ProductionReportDto>> GetProductionReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken)
    {
        var query = _repository.GetProductionReportQuery(_currentUserService.CompanyId);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(x => x.OrderNumber.Contains(searchTerm) || x.ProductName.Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            query = sortBy.ToLower() switch
            {
                "productname" => sortDescending ? query.OrderByDescending(x => x.ProductName) : query.OrderBy(x => x.ProductName),
                "quantity" => sortDescending ? query.OrderByDescending(x => x.Quantity) : query.OrderBy(x => x.Quantity),
                "status" => sortDescending ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
                _ => sortDescending ? query.OrderByDescending(x => x.OrderNumber) : query.OrderBy(x => x.OrderNumber),
            };
        }
        else
        {
            query = query.OrderByDescending(x => x.OrderNumber);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedResult<ProductionReportDto> { Items = items, TotalCount = totalCount, PageNumber = pageNumber, PageSize = pageSize };
    }

    public async Task<PagedResult<SalesReportDto>> GetSalesReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken)
    {
        var query = _repository.GetSalesReportQuery(_currentUserService.CompanyId);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(x => x.OrderNumber.Contains(searchTerm) || x.CustomerName.Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            query = sortBy.ToLower() switch
            {
                "customername" => sortDescending ? query.OrderByDescending(x => x.CustomerName) : query.OrderBy(x => x.CustomerName),
                "totalamount" => sortDescending ? query.OrderByDescending(x => x.TotalAmount) : query.OrderBy(x => x.TotalAmount),
                "status" => sortDescending ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
                _ => sortDescending ? query.OrderByDescending(x => x.OrderDate) : query.OrderBy(x => x.OrderDate),
            };
        }
        else
        {
            query = query.OrderByDescending(x => x.OrderDate);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedResult<SalesReportDto> { Items = items, TotalCount = totalCount, PageNumber = pageNumber, PageSize = pageSize };
    }

    public async Task<PagedResult<WarrantyReportDto>> GetWarrantyReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken)
    {
        var query = _repository.GetWarrantyReportQuery(_currentUserService.CompanyId);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(x => x.SerialNumber.Contains(searchTerm) || x.ProductName.Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            query = sortBy.ToLower() switch
            {
                "productname" => sortDescending ? query.OrderByDescending(x => x.ProductName) : query.OrderBy(x => x.ProductName),
                "serialnumber" => sortDescending ? query.OrderByDescending(x => x.SerialNumber) : query.OrderBy(x => x.SerialNumber),
                "status" => sortDescending ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
                _ => sortDescending ? query.OrderByDescending(x => x.StartDate) : query.OrderBy(x => x.StartDate),
            };
        }
        else
        {
            query = query.OrderByDescending(x => x.StartDate);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedResult<WarrantyReportDto> { Items = items, TotalCount = totalCount, PageNumber = pageNumber, PageSize = pageSize };
    }

    public async Task<PagedResult<AuditReportDto>> GetAuditReportAsync(int pageNumber, int pageSize, string? searchTerm, string? sortBy, bool sortDescending, CancellationToken cancellationToken)
    {
        var query = _repository.GetAuditReportQuery(_currentUserService.CompanyId);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(x => x.Action.Contains(searchTerm) || x.EntityName.Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            query = sortBy.ToLower() switch
            {
                "action" => sortDescending ? query.OrderByDescending(x => x.Action) : query.OrderBy(x => x.Action),
                "entityname" => sortDescending ? query.OrderByDescending(x => x.EntityName) : query.OrderBy(x => x.EntityName),
                _ => sortDescending ? query.OrderByDescending(x => x.Timestamp) : query.OrderBy(x => x.Timestamp),
            };
        }
        else
        {
            query = query.OrderByDescending(x => x.Timestamp);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedResult<AuditReportDto> { Items = items, TotalCount = totalCount, PageNumber = pageNumber, PageSize = pageSize };
    }
}
