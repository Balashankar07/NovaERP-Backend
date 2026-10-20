namespace NovaERP.Domain.Enums;

public enum PackingListStatus
{
    Draft = 1,
    Issued = 2,
    Cancelled = 3
}

public enum DeliveryChallanStatus
{
    Draft = 1,
    Issued = 2,
    Cancelled = 3
}

public enum LogisticsDocumentType
{
    PackingList = 1,
    DeliveryChallan = 2,
    CustomerInvoice = 3,
    ShipmentManifest = 4
}
