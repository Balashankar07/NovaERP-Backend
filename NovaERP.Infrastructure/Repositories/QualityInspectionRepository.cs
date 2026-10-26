using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class QualityInspectionRepository : IQualityInspectionRepository
{
    private readonly AppDbContext _context;

    public QualityInspectionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<QualityInspection>> GetAllPagedAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var query = _context.QualityInspections
            .Include(q => q.QualityDefects)
            .Include(q => q.ProductionExecution)
            .Include(q => q.GoodsReceipt)
            .Include(q => q.GoodsReceiptItem)
            .Include(q => q.Product)
            .Include(q => q.Inspector)
            .Include(q => q.SourceWarehouseLocation)
            .Include(q => q.OutputWarehouse)
            .Include(q => q.OutputWarehouseLocation)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(q => q.InspectionNumber.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            bool isDesc = sortOrder?.ToLower() == "desc";
            query = sortBy.ToLower() switch
            {
                "inspectionnumber" => isDesc ? query.OrderByDescending(x => x.InspectionNumber) : query.OrderBy(x => x.InspectionNumber),
                "inspectiondate" => isDesc ? query.OrderByDescending(x => x.InspectionDate) : query.OrderBy(x => x.InspectionDate),
                "status" => isDesc ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
                _ => isDesc ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt)
            };
        }
        else
        {
            query = query.OrderByDescending(q => q.CreatedAt);
        }

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<QualityInspection>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<QualityInspection?> GetByIdAsync(Guid id)
    {
        return await _context.QualityInspections
            .Include(q => q.QualityDefects)
            .Include(q => q.GoodsReceipt)
            .Include(q => q.GoodsReceiptItem)
            .Include(q => q.ProductionExecution)
            .Include(q => q.Product)
            .Include(q => q.Inspector)
            .Include(q => q.SourceWarehouseLocation)
            .Include(q => q.OutputWarehouse)
            .Include(q => q.OutputWarehouseLocation)
            .FirstOrDefaultAsync(q => q.Id == id);
    }

    public async Task<QualityInspection?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _context.QualityInspections
            .Include(q => q.QualityDefects)
            .Include(q => q.ProductionExecution)
            .Include(q => q.GoodsReceipt)
            .Include(q => q.GoodsReceiptItem)
            .Include(q => q.Product)
            .Include(q => q.Inspector)
            .Include(q => q.SourceWarehouseLocation)
            .Include(q => q.OutputWarehouse)
            .Include(q => q.OutputWarehouseLocation)
            .FirstOrDefaultAsync(q => q.Id == id);
    }

    public async Task<bool> ExistsByExecutionIdAsync(Guid executionId)
    {
        return await _context.QualityInspections.AnyAsync(q => q.ProductionExecutionId == executionId && q.Status != Domain.Enums.QualityInspectionStatus.Cancelled);
    }

    public async Task<bool> ExistsByGoodsReceiptItemIdAsync(Guid goodsReceiptItemId)
    {
        return await _context.QualityInspections.AnyAsync(q => q.GoodsReceiptItemId == goodsReceiptItemId && q.Status != Domain.Enums.QualityInspectionStatus.Cancelled);
    }

    public async Task<string> GenerateInspectionNumberAsync()
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"QI-{today}-";
        
        var count = await _context.QualityInspections.CountAsync(q => q.InspectionNumber.StartsWith(prefix));
        return $"{prefix}{(count + 1).ToString("D4")}";
    }
    
    public async Task AddAsync(QualityInspection inspection)
    {
        await _context.QualityInspections.AddAsync(inspection);
    }

    public void Update(QualityInspection inspection)
    {
        _context.QualityInspections.Update(inspection);
    }

    public void Remove(QualityInspection inspection)
    {
        _context.QualityInspections.Remove(inspection);
    }
}
