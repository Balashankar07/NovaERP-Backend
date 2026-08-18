using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class PurchaseRequestItem : AuditableEntity
{
    public Guid PurchaseRequestId { get; set; }
    public PurchaseRequest? PurchaseRequest { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RequestedQuantity { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal ApprovedQuantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ConvertedQuantity { get; set; }

    [NotMapped]
    public decimal RemainingQuantity => ApprovedQuantity - ConvertedQuantity;

    public string? Remarks { get; set; }
}
