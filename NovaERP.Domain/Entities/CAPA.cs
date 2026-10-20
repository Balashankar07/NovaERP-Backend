using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class CAPA : AuditableEntity
{
    public string CapaNumber { get; set; } = string.Empty;
    public Guid NcrId { get; set; }
    public CapaType Type { get; set; } = CapaType.Corrective;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public string? RootCause { get; set; }
    public string? ContainmentAction { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? PreventiveAction { get; set; }

    public Guid OwnerEmployeeId { get; set; }
    public DateTime? TargetDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string? VerificationNotes { get; set; }
    public CapaStatus Status { get; set; } = CapaStatus.Draft;

    // Navigation properties
    public NonConformanceReport? NonConformanceReport { get; set; }
    public EmployeeProfile? OwnerEmployee { get; set; }
}
