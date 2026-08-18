namespace NovaERP.Domain.Enums;

public enum PurchaseRequestStatus
{
    Draft,
    Submitted,
    PendingApproval,
    Approved,
    Rejected,
    PartiallyConverted,
    FullyConverted,
    Cancelled
}
