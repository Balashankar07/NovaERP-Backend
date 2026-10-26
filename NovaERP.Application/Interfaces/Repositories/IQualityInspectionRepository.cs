using NovaERP.Domain.Entities;
using NovaERP.Application.Common.Models;

namespace NovaERP.Application.Interfaces.Repositories;

public interface IQualityInspectionRepository
{
    Task<PagedResult<QualityInspection>> GetAllPagedAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null);
    Task<QualityInspection?> GetByIdAsync(Guid id);
    Task<QualityInspection?> GetByIdWithDetailsAsync(Guid id);
    Task<bool> ExistsByExecutionIdAsync(Guid executionId);
    Task<bool> ExistsByGoodsReceiptItemIdAsync(Guid goodsReceiptItemId);
    Task<string> GenerateInspectionNumberAsync();
    
    Task AddAsync(QualityInspection inspection);
    void Update(QualityInspection inspection);
    void Remove(QualityInspection inspection);
}
