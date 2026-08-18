using NovaERP.Application.Features.Brands.DTOs;
using NovaERP.Application.Features.ProductCategories.DTOs;
using NovaERP.Application.Features.Units.DTOs;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Features.Products.DTOs;

/// <summary>Full product read model returned by the API.</summary>
public class ProductDto
{
    public Guid Id { get; set; }

    // System identifiers — always read-only, backend-generated
    public string ProductNumber { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ProductType ProductType { get; set; }

    public Guid CategoryId { get; set; }
    public ProductCategoryDto? Category { get; set; }

    public Guid BrandId { get; set; }
    public BrandDto? Brand { get; set; }

    public Guid UnitId { get; set; }
    public UnitDto? Unit { get; set; }

    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int MinimumStock { get; set; }
    public int MaximumStock { get; set; }
    public int ReorderLevel { get; set; }

    public string? ImageUrl { get; set; }
    public string? Specifications { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Create request. Does NOT accept ProductNumber, ProductCode, SKU, or Barcode.
/// These are backend-generated via PostgreSQL sequences.
/// </summary>
public class CreateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Required. 1 = FinishedGood, 2 = Component.</summary>
    public ProductType ProductType { get; set; }

    public Guid CategoryId { get; set; }

    /// <summary>
    /// For FinishedGood, backend enforces Nova Electronics brand and ignores this value.
    /// For Component, this is the actual component manufacturer brand.
    /// </summary>
    public Guid BrandId { get; set; }
    public Guid UnitId { get; set; }

    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int MinimumStock { get; set; }
    public int MaximumStock { get; set; }
    public int ReorderLevel { get; set; }

    public string? ImageUrl { get; set; }
    public string? Specifications { get; set; }
}

/// <summary>
/// Update request. ProductNumber, ProductCode, SKU, Barcode are not accepted — preserved from original.
/// ProductType conversion is validated server-side for dependency safety.
/// </summary>
public class UpdateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>
    /// Changing ProductType is subject to dependency validation.
    /// FinishedGood→Component blocked if active BOM exists.
    /// Component→FinishedGood blocked if referenced in BOMItems.
    /// </summary>
    public ProductType ProductType { get; set; }

    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public Guid UnitId { get; set; }

    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int MinimumStock { get; set; }
    public int MaximumStock { get; set; }
    public int ReorderLevel { get; set; }

    public string? ImageUrl { get; set; }
    public string? Specifications { get; set; }
    public bool IsActive { get; set; }
}
