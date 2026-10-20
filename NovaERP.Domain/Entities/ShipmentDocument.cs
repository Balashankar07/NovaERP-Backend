using System;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ShipmentDocument : AuditableEntity
{
    public Guid ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }

    public LogisticsDocumentType DocumentType { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DateTime DocumentDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Active";

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public Guid? GeneratedByUserId { get; set; }
    public User? GeneratedByUser { get; set; }

    public Guid? PackingListId { get; set; }
    public PackingList? PackingList { get; set; }

    public Guid? DeliveryChallanId { get; set; }
    public DeliveryChallan? DeliveryChallan { get; set; }

    public Guid? CustomerInvoiceId { get; set; }
    public CustomerInvoice? CustomerInvoice { get; set; }

    public string? StorageReference { get; set; }
}
