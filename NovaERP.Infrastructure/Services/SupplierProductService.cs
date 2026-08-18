using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Suppliers.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;

namespace NovaERP.Infrastructure.Services;

public class SupplierProductService : ISupplierProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;

    public SupplierProductService(IUnitOfWork unitOfWork, IAuditLogger auditLogger)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
    }

    public async Task<SupplierProductDto?> GetByIdAsync(Guid id)
    {
        var sp = await _unitOfWork.SupplierProducts.GetByIdAsync(id);
        if (sp == null) return null;
        
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(sp.SupplierId);
        var product = await _unitOfWork.Products.GetByIdAsync(sp.ProductId);
        
        return MapToDto(sp, supplier, product);
    }

    public async Task<IEnumerable<SupplierProductDto>> GetBySupplierIdAsync(Guid supplierId)
    {
        var list = await _unitOfWork.SupplierProducts.GetBySupplierIdAsync(supplierId);
        return list.Select(sp => MapToDto(sp, sp.Supplier, sp.Product));
    }

    public async Task<IEnumerable<SupplierProductDto>> GetByProductIdAsync(Guid productId)
    {
        var list = await _unitOfWork.SupplierProducts.GetByProductIdAsync(productId);
        return list.Select(sp => MapToDto(sp, sp.Supplier, sp.Product));
    }

    public async Task<PagedResult<SupplierProductDto>> GetAllAsync(int pageNumber = 1, int pageSize = 10, string? search = null, string? sortBy = null, string? sortOrder = null)
    {
        var paged = await _unitOfWork.SupplierProducts.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        
        var dtoList = new List<SupplierProductDto>();
        foreach (var sp in paged.Items)
        {
            var supplier = await _unitOfWork.Suppliers.GetByIdAsync(sp.SupplierId);
            var product = await _unitOfWork.Products.GetByIdAsync(sp.ProductId);
            dtoList.Add(MapToDto(sp, supplier, product));
        }

        return new PagedResult<SupplierProductDto>
        {
            Items = dtoList,
            TotalCount = paged.TotalCount,
            PageNumber = paged.PageNumber,
            PageSize = paged.PageSize
        };
    }

    public async Task<SupplierProductDto> CreateAsync(CreateSupplierProductDto dto)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(dto.SupplierId);
        if (supplier == null || !supplier.IsActive)
            throw new Exception("Supplier must exist and be active.");

        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId);
        if (product == null || !product.IsActive)
            throw new Exception("Product must exist and be active.");
            
        if (product.Type != ProductType.Component)
            throw new Exception("Product MUST be a Component.");

        if (string.IsNullOrWhiteSpace(dto.SupplierSKU))
            throw new Exception("SupplierSKU is required.");
            
        if (dto.UnitPrice < 0)
            throw new Exception("UnitPrice must be >= 0.");
            
        if (dto.MOQ <= 0)
            throw new Exception("MOQ must be > 0.");
            
        if (dto.LeadTimeDays < 0)
            throw new Exception("LeadTimeDays must be >= 0.");
            
        if (string.IsNullOrWhiteSpace(dto.Currency))
            throw new Exception("Currency is required.");

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            // Check if relationship already exists
            var existing = await _unitOfWork.SupplierProducts.GetBySupplierAndProductAsync(dto.SupplierId, dto.ProductId);
            if (existing != null)
            {
                if (existing.IsActive)
                {
                    throw new Exception("Supplier-Product relationship already exists.");
                }
                
                // Reactivate and update
                existing.IsActive = true;
                existing.SupplierSKU = dto.SupplierSKU;
                existing.UnitPrice = dto.UnitPrice;
                existing.MOQ = dto.MOQ;
                existing.LeadTimeDays = dto.LeadTimeDays;
                existing.Currency = dto.Currency;
                
                if (dto.IsPreferred)
                {
                    await HandlePreferredSupplierLogic(dto.ProductId, existing.Id);
                }
                existing.IsPreferred = dto.IsPreferred;
                
                _unitOfWork.SupplierProducts.Update(existing);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
                await _auditLogger.LogAsync("Reactivate", "SupplierProduct", existing.Id.ToString(), newValues: $"Reactivated. SKU: {dto.SupplierSKU}");
                return MapToDto(existing, supplier, product);
            }

            // Create new
            if (dto.IsPreferred)
            {
                await HandlePreferredSupplierLogic(dto.ProductId, Guid.Empty);
            }

            var sp = new SupplierProduct
            {
                SupplierId = dto.SupplierId,
                ProductId = dto.ProductId,
                SupplierSKU = dto.SupplierSKU,
                UnitPrice = dto.UnitPrice,
                MOQ = dto.MOQ,
                LeadTimeDays = dto.LeadTimeDays,
                Currency = dto.Currency,
                IsPreferred = dto.IsPreferred,
                IsActive = true
            };

            await _unitOfWork.SupplierProducts.AddAsync(sp);
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();
            await _auditLogger.LogAsync("Create", "SupplierProduct", sp.Id.ToString(), newValues: $"Created. SKU: {sp.SupplierSKU}");
            
            return MapToDto(sp, supplier, product);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<SupplierProductDto?> UpdateAsync(Guid id, UpdateSupplierProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SupplierSKU))
            throw new Exception("SupplierSKU is required.");
            
        if (dto.UnitPrice < 0)
            throw new Exception("UnitPrice must be >= 0.");
            
        if (dto.MOQ <= 0)
            throw new Exception("MOQ must be > 0.");
            
        if (dto.LeadTimeDays < 0)
            throw new Exception("LeadTimeDays must be >= 0.");
            
        if (string.IsNullOrWhiteSpace(dto.Currency))
            throw new Exception("Currency is required.");

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var sp = await _unitOfWork.SupplierProducts.GetByIdAsync(id);
            if (sp == null)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return null;
            }

            if (dto.IsPreferred && !sp.IsPreferred)
            {
                await HandlePreferredSupplierLogic(sp.ProductId, sp.Id);
            }

            sp.SupplierSKU = dto.SupplierSKU;
            sp.UnitPrice = dto.UnitPrice;
            sp.MOQ = dto.MOQ;
            sp.LeadTimeDays = dto.LeadTimeDays;
            sp.Currency = dto.Currency;
            sp.IsPreferred = dto.IsPreferred;
            sp.IsActive = dto.IsActive;

            _unitOfWork.SupplierProducts.Update(sp);
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();
            await _auditLogger.LogAsync("Update", "SupplierProduct", sp.Id.ToString(), newValues: $"Updated. Active: {sp.IsActive}, Preferred: {sp.IsPreferred}");

            var supplier = await _unitOfWork.Suppliers.GetByIdAsync(sp.SupplierId);
            var product = await _unitOfWork.Products.GetByIdAsync(sp.ProductId);
            
            return MapToDto(sp, supplier, product);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var sp = await _unitOfWork.SupplierProducts.GetByIdAsync(id);
        if (sp == null) return false;

        // Perform Soft Delete only
        sp.IsActive = false;
        sp.IsPreferred = false; // Cannot be preferred if inactive
        _unitOfWork.SupplierProducts.Update(sp);
        await _unitOfWork.SaveChangesAsync();
        await _auditLogger.LogAsync("SoftDelete", "SupplierProduct", sp.Id.ToString());

        return true;
    }

    private async Task HandlePreferredSupplierLogic(Guid productId, Guid currentId)
    {
        var activePreferred = await _unitOfWork.SupplierProducts.FindAsync(
            s => s.ProductId == productId && s.IsActive && s.IsPreferred && s.Id != currentId);
            
        foreach (var p in activePreferred)
        {
            p.IsPreferred = false;
            _unitOfWork.SupplierProducts.Update(p);
        }
    }

    private SupplierProductDto MapToDto(SupplierProduct sp, Supplier? supplier, Product? product)
    {
        return new SupplierProductDto
        {
            Id = sp.Id,
            SupplierId = sp.SupplierId,
            SupplierName = supplier?.SupplierName ?? string.Empty,
            ProductId = sp.ProductId,
            ProductCode = product?.ProductCode ?? string.Empty,
            ProductName = product?.Name ?? string.Empty,
            SupplierSKU = sp.SupplierSKU,
            UnitPrice = sp.UnitPrice,
            MOQ = sp.MOQ,
            LeadTimeDays = sp.LeadTimeDays,
            Currency = sp.Currency,
            IsPreferred = sp.IsPreferred,
            IsActive = sp.IsActive,
            CreatedAt = sp.CreatedAt,
            UpdatedAt = sp.UpdatedAt
        };
    }
}
