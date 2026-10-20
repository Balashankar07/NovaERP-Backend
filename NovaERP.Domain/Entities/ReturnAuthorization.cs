using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ReturnAuthorization : AuditableEntity
{
    public string RmaNumber { get; set; } = string.Empty;
    public Guid CustomerReturnId { get; set; }
    public CustomerReturn? CustomerReturn { get; set; }

    public Guid? AuthorizedByUserId { get; set; }
    public User? AuthorizedByUser { get; set; }

    public DateTime AuthorizationDate { get; set; } = DateTime.UtcNow;
    public RmaStatus Status { get; set; } = RmaStatus.Submitted;
    public string? Reason { get; set; }
    public string? Instructions { get; set; }
}
