using System;
using System.Collections.Generic;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class DeliveryChallan : AuditableEntity
{
    public string ChallanNumber { get; set; } = string.Empty;

    public Guid ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }

    public Guid SalesOrderId { get; set; }
    public SalesOrder? SalesOrder { get; set; }

    public Guid DistributorId { get; set; }
    public Distributor? Customer { get; set; }

    public Guid? WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public Guid? IssuedByUserId { get; set; }
    public User? IssuedByUser { get; set; }

    public string Carrier { get; set; } = string.Empty;
    public string? VehicleNumber { get; set; }
    public string DestinationAddress { get; set; } = string.Empty;

    public DeliveryChallanStatus Status { get; set; } = DeliveryChallanStatus.Draft;
    public string? Remarks { get; set; }

    public ICollection<DeliveryChallanItem> Items { get; set; } = new List<DeliveryChallanItem>();
}
