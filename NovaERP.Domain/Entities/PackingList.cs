using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class PackingList : AuditableEntity
{
    public string PackingListNumber { get; set; } = string.Empty;

    public Guid ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }

    public Guid SalesOrderId { get; set; }
    public SalesOrder? SalesOrder { get; set; }

    public Guid DistributorId { get; set; }
    public Distributor? Customer { get; set; }

    public Guid? WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public DateTime PackingDate { get; set; } = DateTime.UtcNow;
    public Guid? PackedByUserId { get; set; }
    public User? PackedByUser { get; set; }

    public int TotalPackages { get; set; } = 1;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? TotalWeightKg { get; set; }

    public string? PackageDimensions { get; set; }

    public PackingListStatus Status { get; set; } = PackingListStatus.Draft;
    public string? Notes { get; set; }

    public ICollection<PackingListItem> Items { get; set; } = new List<PackingListItem>();
}
