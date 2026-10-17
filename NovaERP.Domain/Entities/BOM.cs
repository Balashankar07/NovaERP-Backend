using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class BOM : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string Version { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    // Navigation Property
    public ICollection<BOMItem> BOMItems { get; set; } = new List<BOMItem>();
}
