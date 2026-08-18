using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Exceptions;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Brands.DTOs;
using NovaERP.Application.Features.ProductCategories.DTOs;
using NovaERP.Application.Features.Products.DTOs;
using NovaERP.Application.Features.Units.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogger _auditLogger;
    private readonly AppDbContext _context;

    // Nova Electronics canonical brand name — the only allowed brand for FinishedGoods
    private const string NovaElectronicsBrandName = "Nova Electronics";

    public ProductService(IUnitOfWork unitOfWork, IAuditLogger auditLogger, AppDbContext context)
    {
        _unitOfWork = unitOfWork;
        _auditLogger = auditLogger;
        _context = context;
    }

    public async Task<PagedResult<ProductDto>> GetAllAsync(
        int pageNumber = 1,
        int pageSize = 20,
        string? search = null,
        string? sortBy = null,
        string? sortOrder = null,
        ProductType? productType = null)
    {
        var products = await _unitOfWork.Products.GetAllAsync(
            pageNumber, pageSize, search, sortBy, sortOrder, productType);

        return new PagedResult<ProductDto>
        {
            Items = products.Items.Select(MapToDto).ToList(),
            TotalCount = products.TotalCount,
            PageNumber = products.PageNumber,
            PageSize = products.PageSize
        };
    }

    public async Task<ProductDto?> GetByIdAsync(Guid id)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id);
        if (product == null) return null;
        return MapToDto(product);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        // Validate ProductType is a recognised value
        if (dto.ProductType != ProductType.FinishedGood && dto.ProductType != ProductType.Component)
            throw new BadRequestException("ProductType must be FinishedGood (1) or Component (2).");

        // Validate required fields
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BadRequestException("Product name is required.");

        if (dto.CategoryId == Guid.Empty)
            throw new BadRequestException("Category is required.");

        if (dto.UnitId == Guid.Empty)
            throw new BadRequestException("Unit is required.");

        // Validate pricing
        if (dto.CostPrice < 0)
            throw new BadRequestException("Cost price must be zero or greater.");

        if (dto.SellingPrice < 0)
            throw new BadRequestException("Selling price must be zero or greater.");

        if (dto.SellingPrice < dto.CostPrice)
            throw new BadRequestException("Selling price must be greater than or equal to cost price.");

        // Validate stock levels
        if (dto.MinimumStock < 0) throw new BadRequestException("Minimum stock must be zero or greater.");
        if (dto.MaximumStock < 0) throw new BadRequestException("Maximum stock must be zero or greater.");
        if (dto.ReorderLevel < 0) throw new BadRequestException("Reorder level must be zero or greater.");

        if (dto.MinimumStock > dto.ReorderLevel)
            throw new BadRequestException("Minimum stock must not exceed reorder level.");

        if (dto.ReorderLevel > dto.MaximumStock)
            throw new BadRequestException("Reorder level must not exceed maximum stock.");

        // Brand rule: FinishedGood must use Nova Electronics
        Guid brandId = dto.BrandId;
        if (dto.ProductType == ProductType.FinishedGood)
        {
            var novaBrand = await EnsureNovaElectronicsBrandAsync();
            brandId = novaBrand.Id;
        }
        else
        {
            if (brandId == Guid.Empty)
                throw new BadRequestException("Brand is required for components.");
        }

        // Generate identifiers from existing PostgreSQL sequences
        var productNumber = await GenerateProductNumberAsync();
        var productCode = await GenerateProductCodeAsync();
        var barcode = await GenerateBarcodeAsync();
        var sku = GenerateSku(dto.Name, await GetNextSkuNumberAsync());

        var product = new Product
        {
            Id = Guid.NewGuid(),
            ProductNumber = productNumber,
            ProductCode = productCode,
            SKU = sku,
            Barcode = barcode,
            Name = dto.Name,
            Description = dto.Description,
            Type = dto.ProductType,
            CategoryId = dto.CategoryId,
            BrandId = brandId,
            UnitId = dto.UnitId,
            CostPrice = dto.CostPrice,
            SellingPrice = dto.SellingPrice,
            MinimumStock = dto.MinimumStock,
            MaximumStock = dto.MaximumStock,
            ReorderLevel = dto.ReorderLevel,
            ImageUrl = dto.ImageUrl,
            Specifications = dto.Specifications,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Products.AddAsync(product);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Create", "Product", product.Id.ToString(),
            newValues: $"Number: {product.ProductNumber}, Code: {product.ProductCode}, Name: {product.Name}, Type: {product.Type}");

        var createdProduct = await _unitOfWork.Products.GetByIdAsync(product.Id);
        return MapToDto(createdProduct!);
    }

    public async Task<ProductDto?> UpdateAsync(Guid id, UpdateProductDto dto)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id);
        if (product == null) return null;

        // Validate ProductType value
        if (dto.ProductType != ProductType.FinishedGood && dto.ProductType != ProductType.Component)
            throw new BadRequestException("ProductType must be FinishedGood or Component.");

        // Validate ProductType conversion safety
        if (product.Type != dto.ProductType)
        {
            await ValidateProductTypeConversionAsync(product, dto.ProductType);
        }

        // Validate required fields
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new BadRequestException("Product name is required.");

        // Validate pricing
        if (dto.CostPrice < 0)
            throw new BadRequestException("Cost price must be zero or greater.");

        if (dto.SellingPrice < 0)
            throw new BadRequestException("Selling price must be zero or greater.");

        if (dto.SellingPrice < dto.CostPrice)
            throw new BadRequestException("Selling price must be greater than or equal to cost price.");

        // Validate stock
        if (dto.MinimumStock < 0) throw new BadRequestException("Minimum stock must be zero or greater.");
        if (dto.MaximumStock < 0) throw new BadRequestException("Maximum stock must be zero or greater.");
        if (dto.ReorderLevel < 0) throw new BadRequestException("Reorder level must be zero or greater.");

        if (dto.MinimumStock > dto.ReorderLevel)
            throw new BadRequestException("Minimum stock must not exceed reorder level.");

        if (dto.ReorderLevel > dto.MaximumStock)
            throw new BadRequestException("Reorder level must not exceed maximum stock.");

        // Brand rule enforcement
        Guid brandId = dto.BrandId;
        if (dto.ProductType == ProductType.FinishedGood)
        {
            var novaBrand = await EnsureNovaElectronicsBrandAsync();
            brandId = novaBrand.Id;
        }

        // Update mutable fields only — identifiers are preserved
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.Type = dto.ProductType;
        product.CategoryId = dto.CategoryId;
        product.BrandId = brandId;
        product.UnitId = dto.UnitId;
        product.CostPrice = dto.CostPrice;
        product.SellingPrice = dto.SellingPrice;
        product.MinimumStock = dto.MinimumStock;
        product.MaximumStock = dto.MaximumStock;
        product.ReorderLevel = dto.ReorderLevel;
        product.ImageUrl = dto.ImageUrl;
        product.Specifications = dto.Specifications;
        product.IsActive = dto.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Products.UpdateAsync(product);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogger.LogAsync("Update", "Product", product.Id.ToString());

        var updatedProduct = await _unitOfWork.Products.GetByIdAsync(id);
        return MapToDto(updatedProduct!);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id);
        if (product == null) return false;

        if (product.Type == ProductType.FinishedGood)
        {
            // Block if referenced by Inventory records
            var hasInventory = await _context.Inventories.AnyAsync(i => i.ProductId == id);
            if (hasInventory)
                throw new ConflictException(
                    $"Cannot delete '{product.Name}': it has active inventory records. Deactivate it instead.");

            // Block if referenced by SalesOrderItems
            var hasSalesOrders = await _context.SalesOrderItems.AnyAsync(soi => soi.ProductId == id);
            if (hasSalesOrders)
                throw new ConflictException(
                    $"Cannot delete '{product.Name}': it is referenced by sales order items.");

            // Block if referenced by ProductionOrders
            var hasProductionOrders = await _context.ProductionOrders.AnyAsync(po => po.ProductId == id);
            if (hasProductionOrders)
                throw new ConflictException(
                    $"Cannot delete '{product.Name}': it is referenced by production orders.");

            // Block if referenced by BOMs
            var hasBOM = await _context.BOMs.AnyAsync(b => b.ProductId == id && b.IsActive);
            if (hasBOM)
                throw new ConflictException(
                    $"Cannot delete '{product.Name}': it has an active Bill of Materials.");

            // Safe: soft-delete (deactivate)
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Products.UpdateAsync(product);
            await _unitOfWork.SaveChangesAsync();

            await _auditLogger.LogAsync("Deactivate", "Product", product.Id.ToString(),
                newValues: $"Soft-deleted: {product.Name}");
        }
        else // Component
        {
            // Block if referenced by any active BOMItem
            var bomItemCount = await _context.BOMItems
                .Include(bi => bi.BOM)
                .CountAsync(bi => bi.RawMaterialProductId == id && bi.BOM.IsActive);

            if (bomItemCount > 0)
                throw new ConflictException(
                    $"Cannot delete '{product.Name}': it is used in {bomItemCount} active Bill(s) of Materials.");

            // Block if referenced by inventory
            var hasInventory = await _context.Inventories.AnyAsync(i => i.ProductId == id);
            if (hasInventory)
                throw new ConflictException(
                    $"Cannot delete '{product.Name}': it has inventory records. Deactivate it instead.");

            // Safe to deactivate (soft-delete)
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Products.UpdateAsync(product);
            await _unitOfWork.SaveChangesAsync();

            await _auditLogger.LogAsync("Deactivate", "Product", product.Id.ToString(),
                newValues: $"Soft-deleted: {product.Name}");
        }

        return true;
    }

    // ─────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// Validates that converting a product from one type to another is safe.
    /// Throws ConflictException if dependencies exist that prevent conversion.
    /// </summary>
    private async Task ValidateProductTypeConversionAsync(Product product, ProductType newType)
    {
        if (product.Type == ProductType.FinishedGood && newType == ProductType.Component)
        {
            // FG → Component: blocked if active BOM or production orders exist
            var hasBOM = await _context.BOMs.AnyAsync(b => b.ProductId == product.Id && b.IsActive);
            if (hasBOM)
                throw new ConflictException(
                    $"Cannot convert '{product.Name}' to Component: it has an active Bill of Materials.");

            var hasOrders = await _context.ProductionOrders.AnyAsync(po => po.ProductId == product.Id);
            if (hasOrders)
                throw new ConflictException(
                    $"Cannot convert '{product.Name}' to Component: it is referenced by production orders.");
        }
        else if (product.Type == ProductType.Component && newType == ProductType.FinishedGood)
        {
            // Component → FG: blocked if referenced as BOM raw material
            var isBOMRawMaterial = await _context.BOMItems
                .Include(bi => bi.BOM)
                .AnyAsync(bi => bi.RawMaterialProductId == product.Id && bi.BOM.IsActive);

            if (isBOMRawMaterial)
                throw new ConflictException(
                    $"Cannot convert '{product.Name}' to Finished Good: it is used as a component in active Bills of Materials.");
        }
    }

    /// <summary>
    /// Ensures the Nova Electronics brand exists. Creates it if missing.
    /// Uses stable logic to avoid duplicates.
    /// </summary>
    private async Task<Brand> EnsureNovaElectronicsBrandAsync()
    {
        var brand = await _context.Brands
            .FirstOrDefaultAsync(b => b.Name == NovaElectronicsBrandName);

        if (brand == null)
        {
            brand = new Brand
            {
                Id = Guid.NewGuid(),
                Name = NovaElectronicsBrandName,
                Description = "Nova Electronics — Consumer Electronics Manufacturer",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await _context.Brands.AddAsync(brand);
            await _context.SaveChangesAsync();
        }

        return brand;
    }

    /// <summary>
    /// Generates the next ProductNumber using the existing PostgreSQL sequence (ProductNumberSeq).
    /// Format: PROD-XXXX (zero-padded to 4 digits).
    /// </summary>
    private async Task<string> GenerateProductNumberAsync()
    {
        var result = await _context.Database
            .SqlQueryRaw<long>("SELECT nextval('\"ProductNumberSeq\"')")
            .ToListAsync();
        var seq = result.First();
        return $"PROD-{seq:D4}";
    }

    /// <summary>
    /// Generates the next ProductCode using the existing PostgreSQL sequence (ProductCodeSeq).
    /// Format: PRD-XXX (zero-padded to 3 digits).
    /// </summary>
    private async Task<string> GenerateProductCodeAsync()
    {
        var result = await _context.Database
            .SqlQueryRaw<long>("SELECT nextval('\"ProductCodeSeq\"')")
            .ToListAsync();
        var seq = result.First();
        return $"PRD-{seq:D3}";
    }

    /// <summary>
    /// Generates the next Barcode using the existing PostgreSQL sequence (BarcodeSeq).
    /// </summary>
    private async Task<string> GenerateBarcodeAsync()
    {
        var result = await _context.Database
            .SqlQueryRaw<long>("SELECT nextval('\"BarcodeSeq\"')")
            .ToListAsync();
        return result.First().ToString();
    }

    /// <summary>
    /// Gets the next SKU sequential number from the existing PostgreSQL sequence (SkuSeq).
    /// </summary>
    private async Task<long> GetNextSkuNumberAsync()
    {
        var result = await _context.Database
            .SqlQueryRaw<long>("SELECT nextval('\"SkuSeq\"')")
            .ToListAsync();
        return result.First();
    }

    /// <summary>
    /// Generates a SKU from a product name abbreviation + sequential number.
    /// e.g. "Bluetooth Speaker" → "BS-1005"
    /// </summary>
    private static string GenerateSku(string productName, long skuNumber)
    {
        // Take the initials of each word (up to 3 letters)
        var words = productName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var prefix = string.Concat(words
            .Where(w => char.IsLetter(w[0]))
            .Take(3)
            .Select(w => char.ToUpper(w[0])));

        if (string.IsNullOrEmpty(prefix)) prefix = "XX";
        return $"{prefix}-{skuNumber}";
    }

    private static ProductDto MapToDto(Product product)
    {
        return new ProductDto
        {
            Id = product.Id,
            ProductNumber = product.ProductNumber,
            ProductCode = product.ProductCode,
            SKU = product.SKU,
            Barcode = product.Barcode,
            Name = product.Name,
            Description = product.Description,
            ProductType = product.Type,
            CategoryId = product.CategoryId,
            Category = product.Category != null ? new ProductCategoryDto
            {
                Id = product.Category.Id,
                Name = product.Category.Name,
                Description = product.Category.Description,
                IsActive = product.Category.IsActive
            } : null,
            BrandId = product.BrandId,
            Brand = product.Brand != null ? new BrandDto
            {
                Id = product.Brand.Id,
                Name = product.Brand.Name,
                Description = product.Brand.Description,
                IsActive = product.Brand.IsActive
            } : null,
            UnitId = product.UnitId,
            Unit = product.Unit != null ? new UnitDto
            {
                Id = product.Unit.Id,
                Name = product.Unit.Name,
                Abbreviation = product.Unit.Abbreviation,
                Description = product.Unit.Description,
                IsActive = product.Unit.IsActive
            } : null,
            CostPrice = product.CostPrice,
            SellingPrice = product.SellingPrice,
            MinimumStock = product.MinimumStock,
            MaximumStock = product.MaximumStock,
            ReorderLevel = product.ReorderLevel,
            ImageUrl = product.ImageUrl,
            Specifications = product.Specifications,
            IsActive = product.IsActive
        };
    }
}
