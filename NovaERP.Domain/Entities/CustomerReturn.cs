using System.ComponentModel.DataAnnotations.Schema;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class CustomerReturn : AuditableEntity
{
    public string ReturnNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; } // Distributor ID
    public Distributor? Customer { get; set; }

    public Guid SalesOrderId { get; set; }
    public SalesOrder? SalesOrder { get; set; }

    public Guid? ShipmentId { get; set; }
    public Shipment? Shipment { get; set; }

    public Guid? WarrantyClaimId { get; set; }
    public WarrantyClaim? WarrantyClaim { get; set; }

    public string Reason { get; set; } = string.Empty;
    public DateTime RequestedDate { get; set; } = DateTime.UtcNow;
    public CustomerReturnStatus Status { get; set; } = CustomerReturnStatus.Draft;
    public string? Notes { get; set; }

    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public ICollection<CustomerReturnItem> Items { get; set; } = new List<CustomerReturnItem>();
    public ReturnAuthorization? RMA { get; set; }
    public ICollection<ReturnReceipt> Receipts { get; set; } = new List<ReturnReceipt>();
    public ICollection<ReturnDisposition> Dispositions { get; set; } = new List<ReturnDisposition>();
    public ICollection<CustomerRepairRequest> Repairs { get; set; } = new List<CustomerRepairRequest>();
    public ICollection<ReplacementOrder> Replacements { get; set; } = new List<ReplacementOrder>();
}
