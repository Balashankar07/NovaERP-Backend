using NovaERP.Application.Features.BOMs.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Services;

public class BOMService : IBOMService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;

    public BOMService(IUnitOfWork unitOfWork, IAuditLogger auditLogger)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
    }

    public async Task<NovaERP.Application.Common.Models.PagedResult<BOMDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var pagedBoms = await _unitOfWork.BOMs.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);

        var dtos = pagedBoms.Items.Select(b => new BOMDto
        {
            Id = b.Id,
            ProductId = b.ProductId,
            ProductName = b.Product?.Name ?? string.Empty,
            Version = b.Version,
            Description = b.Description,
            IsActive = b.IsActive,
            Items = b.BOMItems.Select(i => new BOMItemDto
            {
                Id = i.Id,
                BomId = i.BomId,
                RawMaterialProductId = i.RawMaterialProductId,
                RawMaterialProductName = i.RawMaterialProduct?.Name ?? string.Empty,
                Quantity = i.Quantity,
                UnitId = i.UnitId,
                UnitName = i.Unit?.Name ?? string.Empty,
                WastePercentage = i.WastePercentage,
                Remarks = i.Remarks
            }).ToList()
        }).ToList();

        return new NovaERP.Application.Common.Models.PagedResult<BOMDto>
        {
            Items = dtos,
            TotalCount = pagedBoms.TotalCount,
            PageNumber = pagedBoms.PageNumber,
            PageSize = pagedBoms.PageSize
        };
    }

    public async Task<BOMDto?> GetByIdAsync(Guid id)
    {
        var bom = await _unitOfWork.BOMs.GetByIdAsync(id);
        if (bom == null) return null;

        return new BOMDto
        {
            Id = bom.Id,
            ProductId = bom.ProductId,
            ProductName = bom.Product?.Name ?? string.Empty,
            Version = bom.Version,
            Description = bom.Description,
            IsActive = bom.IsActive,
            Items = bom.BOMItems.Select(i => new BOMItemDto
            {
                Id = i.Id,
                BomId = i.BomId,
                RawMaterialProductId = i.RawMaterialProductId,
                RawMaterialProductName = i.RawMaterialProduct?.Name ?? string.Empty,
                Quantity = i.Quantity,
                UnitId = i.UnitId,
                UnitName = i.Unit?.Name ?? string.Empty,
                WastePercentage = i.WastePercentage,
                Remarks = i.Remarks
            }).ToList()
        };
    }

    public async Task<BOMDto> CreateAsync(CreateBOMDto dto)
    {
        var bom = new BOM
        {
            ProductId = dto.ProductId,
            Version = dto.Version,
            Description = dto.Description,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            BOMItems = dto.Items.Select(i => new BOMItem
            {
                RawMaterialProductId = i.RawMaterialProductId,
                Quantity = i.Quantity,
                UnitId = i.UnitId,
                WastePercentage = i.WastePercentage,
                Remarks = i.Remarks
            }).ToList()
        };

        await _unitOfWork.BOMs.AddAsync(bom);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "BOM", bom.Id.ToString(), newValues: $"Version: {bom.Version}, ItemsCount: {bom.BOMItems.Count}");

        var createdDto = await GetByIdAsync(bom.Id);
        return createdDto!;
    }

    public async Task<BOMDto?> UpdateAsync(Guid id, UpdateBOMDto dto)
    {
        var bom = await _unitOfWork.BOMs.GetByIdAsync(id);
        if (bom == null) return null;

        var oldBom = new BOM
        {
            Version = bom.Version,
            Description = bom.Description,
            IsActive = bom.IsActive
        };

        bom.Version = dto.Version;
        bom.Description = dto.Description;
        bom.IsActive = dto.IsActive;

        // Update items
        var existingItems = bom.BOMItems.ToList();
        
        var dtoItemIds = dto.Items.Where(i => i.Id.HasValue).Select(i => i.Id!.Value).ToList();
        var itemsToRemove = existingItems.Where(i => !dtoItemIds.Contains(i.Id)).ToList();
        foreach (var item in itemsToRemove)
        {
            await _unitOfWork.BOMItems.DeleteAsync(item);
        }

        foreach (var dtoItem in dto.Items)
        {
            if (dtoItem.Id.HasValue && dtoItem.Id.Value != Guid.Empty)
            {
                var existingItem = existingItems.FirstOrDefault(i => i.Id == dtoItem.Id.Value);
                if (existingItem != null)
                {
                    existingItem.RawMaterialProductId = dtoItem.RawMaterialProductId;
                    existingItem.Quantity = dtoItem.Quantity;
                    existingItem.UnitId = dtoItem.UnitId;
                    existingItem.WastePercentage = dtoItem.WastePercentage;
                    existingItem.Remarks = dtoItem.Remarks;
                    await _unitOfWork.BOMItems.UpdateAsync(existingItem);
                }
            }
            else
            {
                var newItem = new BOMItem
                {
                    BomId = bom.Id,
                    RawMaterialProductId = dtoItem.RawMaterialProductId,
                    Quantity = dtoItem.Quantity,
                    UnitId = dtoItem.UnitId,
                    WastePercentage = dtoItem.WastePercentage,
                    Remarks = dtoItem.Remarks
                };
                await _unitOfWork.BOMItems.AddAsync(newItem);
            }
        }

        await _unitOfWork.BOMs.UpdateAsync(bom);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "BOM", bom.Id.ToString());

        return await GetByIdAsync(bom.Id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var bom = await _unitOfWork.BOMs.GetByIdAsync(id);
        if (bom == null) return false;

        await _unitOfWork.BOMs.DeleteAsync(bom);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Delete", "BOM", bom.Id.ToString());

        return true;
    }
}
