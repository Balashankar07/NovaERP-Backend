using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class NonConformanceReport : AuditableEntity
{
    public string NcrNumber { get; set; } = string.Empty;
    public Guid QualityInspectionId { get; set; }
    public Guid? ProductionExecutionId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? BatchId { get; set; }
    public Guid? SerialNumberId { get; set; }

    public Guid ReportedByUserId { get; set; }
    public Guid? AssignedToUserId { get; set; }

    public NcrSeverity Severity { get; set; } = NcrSeverity.Minor;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DetectedDate { get; set; } = DateTime.UtcNow;
    public NcrStatus Status { get; set; } = NcrStatus.Open;

    public string? ContainmentAction { get; set; }
    public string? RootCauseCategory { get; set; }
    public string? RootCauseDescription { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? PreventiveAction { get; set; }

    public DateTime? ClosedDate { get; set; }
    public string? ClosureRemarks { get; set; }

    // Navigation properties
    public QualityInspection? QualityInspection { get; set; }
    public ProductionExecution? ProductionExecution { get; set; }
    public Product? Product { get; set; }
    public InventoryBatch? Batch { get; set; }
    public InventorySerialNumber? SerialNumber { get; set; }
    public User? ReportedByUser { get; set; }
    public User? AssignedToUser { get; set; }

    public ICollection<CAPA> CAPAs { get; set; } = new List<CAPA>();
    public ICollection<QualityDisposition> QualityDispositions { get; set; } = new List<QualityDisposition>();
    public ICollection<ReworkRequest> ReworkRequests { get; set; } = new List<ReworkRequest>();
    public ICollection<ScrapRecord> ScrapRecords { get; set; } = new List<ScrapRecord>();
}
