using NovaERP.Application.Features.BOMs.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

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
            EffectiveDate = b.EffectiveDate,
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
            EffectiveDate = bom.EffectiveDate,
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
        var targetProduct = await _unitOfWork.Products.GetByIdAsync(dto.ProductId);
        if (targetProduct == null || targetProduct.Type != NovaERP.Domain.Enums.ProductType.FinishedGood)
        {
            throw new Exception("A BOM can only be created for an existing Finished Good product.");
        }

        foreach (var item in dto.Items)
        {
            var componentProduct = await _unitOfWork.Products.GetByIdAsync(item.RawMaterialProductId);
            if (componentProduct == null || componentProduct.Type != NovaERP.Domain.Enums.ProductType.Component)
            {
                throw new Exception($"BOM Item '{item.RawMaterialProductId}' must be a valid Component.");
            }
        }

        var bom = new BOM
        {
            ProductId = dto.ProductId,
            Version = dto.Version,
            Description = dto.Description,
            EffectiveDate = dto.EffectiveDate,
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

        var targetProduct = await _unitOfWork.Products.GetByIdAsync(bom.ProductId);
        if (targetProduct == null || targetProduct.Type != NovaERP.Domain.Enums.ProductType.FinishedGood)
        {
            throw new Exception("A BOM must belong to a Finished Good product.");
        }

        foreach (var item in dto.Items)
        {
            var componentProduct = await _unitOfWork.Products.GetByIdAsync(item.RawMaterialProductId);
            if (componentProduct == null || componentProduct.Type != NovaERP.Domain.Enums.ProductType.Component)
            {
                throw new Exception($"BOM Item '{item.RawMaterialProductId}' must be a valid Component.");
            }
        }

        bom.Version = dto.Version;
        bom.Description = dto.Description;
        bom.EffectiveDate = dto.EffectiveDate;
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

    public async Task<bool> ActivateAsync(Guid id)
    {
        var bom = await _unitOfWork.BOMs.GetByIdAsync(id);
        if (bom == null) return false;

        if (bom.EffectiveDate > DateTime.UtcNow)
        {
            throw new Exception("Cannot activate a future-effective BOM.");
        }

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            // Find currently active BOM for the same product
            var pagedBoms = await _unitOfWork.BOMs.GetAllAsync(1, 100); // Assuming small number of BOMs per product
            var activeBoms = pagedBoms.Items.Where(b => b.ProductId == bom.ProductId && b.IsActive && b.Id != id).ToList();

            foreach (var activeBom in activeBoms)
            {
                activeBom.IsActive = false;
                await _unitOfWork.BOMs.UpdateAsync(activeBom);
                await _auditLogger.LogAsync("Update", "BOM", activeBom.Id.ToString(), newValues: "Deactivated automatically due to new BOM activation");
            }

            bom.IsActive = true;
            await _unitOfWork.BOMs.UpdateAsync(bom);
            await _unitOfWork.SaveChangesAsync();

            await _auditLogger.LogAsync("Update", "BOM", bom.Id.ToString(), newValues: "Activated");
            await _unitOfWork.CommitTransactionAsync();
            return true;
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<bool> DeactivateAsync(Guid id)
    {
        var bom = await _unitOfWork.BOMs.GetByIdAsync(id);
        if (bom == null) return false;

        bom.IsActive = false;
        await _unitOfWork.BOMs.UpdateAsync(bom);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "BOM", bom.Id.ToString(), newValues: "Deactivated");

        return true;
    }
}
