namespace NovaERP.Domain.Enums;

public enum SalesOrderStatus
{
    Draft = 0,
    PendingApproval = 1,
    Approved = 2,
    Reserved = 3,
    ReadyToShip = 4,
    PartiallyShipped = 5,
    Completed = 6,
    Rejected = 7,
    Cancelled = 8
}
