using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class CustomerReturnItem : AuditableEntity
{
    public Guid CustomerReturnId { get; set; }
    public CustomerReturn? CustomerReturn { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    public string? SerialNumber { get; set; }
    public string? BatchNumber { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ReturnItemCondition Condition { get; set; } = ReturnItemCondition.OpenedDefective;
}
