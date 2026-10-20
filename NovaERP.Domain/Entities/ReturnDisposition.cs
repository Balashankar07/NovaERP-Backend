using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ReturnDisposition : AuditableEntity
{
    public string DispositionNumber { get; set; } = string.Empty;

    public Guid CustomerReturnId { get; set; }
    public CustomerReturn? CustomerReturn { get; set; }

    public Guid ReturnReceiptId { get; set; }
    public ReturnReceipt? ReturnReceipt { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Quantity { get; set; }

    public ReturnDispositionType DispositionType { get; set; } = ReturnDispositionType.Hold;
    public ReturnDispositionStatus Status { get; set; } = ReturnDispositionStatus.Pending;
    public string Reason { get; set; } = string.Empty;

    public Guid? ApprovedByUserId { get; set; }
    public User? ApprovedByUser { get; set; }

    public DateTime? ApprovedDate { get; set; }
    public DateTime? ExecutedDate { get; set; }
    public string? Notes { get; set; }
}
