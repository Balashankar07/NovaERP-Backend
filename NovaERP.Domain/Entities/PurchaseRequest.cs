using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class PurchaseRequest : AuditableEntity
{
    public string RequestNumber { get; set; } = string.Empty;
    public string RequestedBy { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    
    public DateTime RequestDate { get; set; }
    public DateTime RequiredByDate { get; set; }
    
    public PurchaseRequestPriority Priority { get; set; } = PurchaseRequestPriority.Normal;
    public string Reason { get; set; } = string.Empty;
    
    public PurchaseRequestStatus Status { get; set; } = PurchaseRequestStatus.Draft;
    
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    
    public PurchaseRequestSource Source { get; set; } = PurchaseRequestSource.Manual;
    public Guid? SourceReferenceId { get; set; }
    
    public ICollection<PurchaseRequestItem> Items { get; set; } = new List<PurchaseRequestItem>();
}
