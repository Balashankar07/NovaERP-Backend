namespace NovaERP.Domain.Enums;

public enum NotificationType
{
    ApprovalRequired = 1,
    StatusChange = 2,
    LowStock = 3,
    QualityAlert = 4,
    WarrantyAlert = 5,
    ReturnAlert = 6,
    ProductionAlert = 7,
    ProcurementAlert = 8,
    ShipmentAlert = 9,
    FinanceAlert = 10,
    HRAlert = 11,
    LogisticsAlert = 12,
    SystemAlert = 13
}

public enum NotificationPriority
{
    Low = 1,
    Normal = 2,
    High = 3,
    Critical = 4
}
