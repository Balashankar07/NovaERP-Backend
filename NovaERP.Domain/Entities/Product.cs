using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class Product : AuditableEntity
{
    /// <summary>Human-readable product number, e.g. PROD-0001. Backend-generated via PostgreSQL sequence.</summary>
    public string ProductNumber { get; set; } = string.Empty;

    /// <summary>Short product code, e.g. PRD-001. Backend-generated via PostgreSQL sequence.</summary>
    public string ProductCode { get; set; } = string.Empty;

    /// <summary>Stock Keeping Unit, e.g. BS-1000. Backend-generated via PostgreSQL sequence.</summary>
    public string SKU { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>
    /// FinishedGood = 1: manufactured product for sale. Brand must be Nova Electronics.
    /// Component    = 2: raw material / sub-assembly used in BOMs.
    /// </summary>
    public ProductType Type { get; set; } = ProductType.FinishedGood;

    public Guid CategoryId { get; set; }
    public ProductCategory Category { get; set; } = null!;

    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;

    public Guid UnitId { get; set; }
    public Unit Unit { get; set; } = null!;

    public decimal CostPrice { get; set; }

    public decimal SellingPrice { get; set; }

    public int MinimumStock { get; set; }

    public int MaximumStock { get; set; }

    public int ReorderLevel { get; set; }

    public string? Barcode { get; set; }

    public string? ImageUrl { get; set; }

    /// <summary>JSON blob storing product specifications. Context-aware per product type/name.</summary>
    public string? Specifications { get; set; }

    public bool IsActive { get; set; } = true;
}
