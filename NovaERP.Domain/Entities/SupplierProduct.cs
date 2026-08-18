using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class SupplierProduct : AuditableEntity
{
    public Guid SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string SupplierSKU { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MOQ { get; set; }

    public int LeadTimeDays { get; set; }

    public string Currency { get; set; } = "USD";

    public bool IsPreferred { get; set; } = false;

    public bool IsActive { get; set; } = true;
}
