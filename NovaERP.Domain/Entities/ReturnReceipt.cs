using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ReturnReceipt : AuditableEntity
{
    public string ReceiptNumber { get; set; } = string.Empty;
    public Guid CustomerReturnId { get; set; }
    public CustomerReturn? CustomerReturn { get; set; }

    public Guid? ReturnAuthorizationId { get; set; }
    public ReturnAuthorization? ReturnAuthorization { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public Guid? WarehouseLocationId { get; set; }
    public WarehouseLocation? WarehouseLocation { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid? ReceivedByUserId { get; set; }
    public User? ReceivedByUser { get; set; }

    public DateTime ReceivedDate { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    public string? SerialNumber { get; set; }
    public string? BatchNumber { get; set; }
    public ReturnItemCondition Condition { get; set; } = ReturnItemCondition.OpenedDefective;
    public string? Notes { get; set; }

    public Guid? QualityInspectionId { get; set; }
    public QualityInspection? QualityInspection { get; set; }
}
