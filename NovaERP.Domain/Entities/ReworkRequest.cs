using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class ReworkRequest : AuditableEntity
{
    public string ReworkNumber { get; set; } = string.Empty;
    public Guid QualityInspectionId { get; set; }
    public Guid? NcrId { get; set; }
    public Guid? ProductionExecutionId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;

    public Guid? AssignedWorkCenterId { get; set; }
    public Guid? AssignedEmployeeId { get; set; }

    public ReworkStatus Status { get; set; } = ReworkStatus.Requested;
    public DateTime? StartDate { get; set; }
    public DateTime? CompletionDate { get; set; }
    public string? Remarks { get; set; }

    public Guid? ApprovedByUserId { get; set; }

    // Navigation properties
    public QualityInspection? QualityInspection { get; set; }
    public NonConformanceReport? NonConformanceReport { get; set; }
    public ProductionExecution? ProductionExecution { get; set; }
    public Product? Product { get; set; }
    public WorkCenter? AssignedWorkCenter { get; set; }
    public EmployeeProfile? AssignedEmployee { get; set; }
    public User? ApprovedByUser { get; set; }
}
