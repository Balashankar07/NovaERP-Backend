using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class ProductionRouting : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string Version { get; set; } = "1.0";
    public bool IsActive { get; set; } = true;

    public ICollection<ProductionRoutingOperation> Operations { get; set; } = new List<ProductionRoutingOperation>();
}
