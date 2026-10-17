namespace NovaERP.Domain.Enums;

public enum PurchaseOrderStatus
{
    Draft,
    PendingApproval,
    Approved,
    Sent,
    PartiallyReceived,
    Rejected,
    Cancelled,
    Closed
}
