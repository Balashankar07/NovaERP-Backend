using NovaERP.Domain.Enums;

namespace NovaERP.Application.DTOs.QualityCompliance;

// NCR DTOs
public class NonConformanceReportDto
{
    public Guid Id { get; set; }
    public string NcrNumber { get; set; } = string.Empty;
    public Guid QualityInspectionId { get; set; }
    public string QualityInspectionNumber { get; set; } = string.Empty;
    public Guid? ProductionExecutionId { get; set; }
    public string? ProductionExecutionNumber { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Guid? BatchId { get; set; }
    public string? BatchNumber { get; set; }
    public Guid? SerialNumberId { get; set; }
    public string? SerialNumber { get; set; }

    public Guid ReportedByUserId { get; set; }
    public string ReportedByUserName { get; set; } = string.Empty;
    public Guid? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }

    public string Severity { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DetectedDate { get; set; }
    public string Status { get; set; } = string.Empty;

    public string? ContainmentAction { get; set; }
    public string? RootCauseCategory { get; set; }
    public string? RootCauseDescription { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? PreventiveAction { get; set; }

    public DateTime? ClosedDate { get; set; }
    public string? ClosureRemarks { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class CreateNcrDto
{
    public Guid QualityInspectionId { get; set; }
    public Guid? ProductionExecutionId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? BatchId { get; set; }
    public Guid? SerialNumberId { get; set; }
    public Guid? AssignedToUserId { get; set; }

    public NcrSeverity Severity { get; set; } = NcrSeverity.Minor;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ContainmentAction { get; set; }
}

public class UpdateNcrDto
{
    public NcrSeverity Severity { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ContainmentAction { get; set; }
    public string? RootCauseCategory { get; set; }
    public string? RootCauseDescription { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? PreventiveAction { get; set; }
}

public class AssignNcrDto
{
    public Guid AssignedToUserId { get; set; }
}

public class UpdateNcrStatusDto
{
    public NcrStatus Status { get; set; }
    public string? ClosureRemarks { get; set; }
}

// CAPA DTOs
public class CapaDto
{
    public Guid Id { get; set; }
    public string CapaNumber { get; set; } = string.Empty;
    public Guid NcrId { get; set; }
    public string NcrNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public string? RootCause { get; set; }
    public string? ContainmentAction { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? PreventiveAction { get; set; }

    public Guid OwnerEmployeeId { get; set; }
    public string OwnerEmployeeName { get; set; } = string.Empty;
    public DateTime? TargetDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string? VerificationNotes { get; set; }
    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}

public class CreateCapaDto
{
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
}

public class UpdateCapaDto
{
    public CapaType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? RootCause { get; set; }
    public string? ContainmentAction { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? PreventiveAction { get; set; }
    public Guid OwnerEmployeeId { get; set; }
    public DateTime? TargetDate { get; set; }
    public CapaStatus Status { get; set; }
}

public class VerifyCapaDto
{
    public bool IsEffective { get; set; }
    public string VerificationNotes { get; set; } = string.Empty;
}

// DISPOSITION DTOs
public class QualityDispositionDto
{
    public Guid Id { get; set; }
    public string DispositionNumber { get; set; } = string.Empty;
    public Guid QualityInspectionId { get; set; }
    public string QualityInspectionNumber { get; set; } = string.Empty;
    public Guid? NcrId { get; set; }
    public string? NcrNumber { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }

    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public Guid? WarehouseLocationId { get; set; }
    public string? LocationName { get; set; }

    public Guid? BatchId { get; set; }
    public string? BatchNumber { get; set; }
    public Guid? SerialNumberId { get; set; }
    public string? SerialNumber { get; set; }

    public string DispositionType { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;

    public Guid? ApprovedByUserId { get; set; }
    public string? ApprovedByUserName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}

public class CreateQualityDispositionDto
{
    public Guid QualityInspectionId { get; set; }
    public Guid? NcrId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }

    public Guid WarehouseId { get; set; }
    public Guid? WarehouseLocationId { get; set; }
    public Guid? BatchId { get; set; }
    public Guid? SerialNumberId { get; set; }

    public QualityDispositionType DispositionType { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ApproveDispositionDto
{
    public bool Approve { get; set; } = true;
    public string? Remarks { get; set; }
}

// REWORK DTOs
public class ReworkRequestDto
{
    public Guid Id { get; set; }
    public string ReworkNumber { get; set; } = string.Empty;
    public Guid QualityInspectionId { get; set; }
    public string QualityInspectionNumber { get; set; } = string.Empty;
    public Guid? NcrId { get; set; }
    public string? NcrNumber { get; set; }
    public Guid? ProductionExecutionId { get; set; }
    public string? ProductionExecutionNumber { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;

    public Guid? AssignedWorkCenterId { get; set; }
    public string? WorkCenterName { get; set; }
    public Guid? AssignedEmployeeId { get; set; }
    public string? AssignedEmployeeName { get; set; }

    public string Status { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? CompletionDate { get; set; }
    public string? Remarks { get; set; }

    public Guid? ApprovedByUserId { get; set; }
    public string? ApprovedByUserName { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class CreateReworkRequestDto
{
    public Guid QualityInspectionId { get; set; }
    public Guid? NcrId { get; set; }
    public Guid? ProductionExecutionId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;

    public Guid? AssignedWorkCenterId { get; set; }
    public Guid? AssignedEmployeeId { get; set; }
}

public class ApproveReworkDto
{
    public bool Approve { get; set; } = true;
    public string? Remarks { get; set; }
}

public class CompleteReworkDto
{
    public string? Remarks { get; set; }
}

// SCRAP DTOs
public class ScrapRecordDto
{
    public Guid Id { get; set; }
    public string ScrapNumber { get; set; } = string.Empty;
    public Guid QualityInspectionId { get; set; }
    public string QualityInspectionNumber { get; set; } = string.Empty;
    public Guid? NcrId { get; set; }
    public string? NcrNumber { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;

    public Guid? BatchId { get; set; }
    public string? BatchNumber { get; set; }
    public Guid? SerialNumberId { get; set; }
    public string? SerialNumber { get; set; }

    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public Guid? WarehouseLocationId { get; set; }
    public string? LocationName { get; set; }

    public decimal Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;

    public Guid? ApprovedByUserId { get; set; }
    public string? ApprovedByUserName { get; set; }
    public DateTime? ScrapDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class CreateScrapRecordDto
{
    public Guid QualityInspectionId { get; set; }
    public Guid? NcrId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? BatchId { get; set; }
    public Guid? SerialNumberId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid? WarehouseLocationId { get; set; }
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ApproveScrapDto
{
    public bool Approve { get; set; } = true;
    public string? Remarks { get; set; }
}

// REPORT SUMMARY DTO
public class QualityComplianceSummaryDto
{
    public int TotalNcrs { get; set; }
    public int OpenNcrs { get; set; }
    public int ClosedNcrs { get; set; }
    public Dictionary<string, int> NcrsBySeverity { get; set; } = new();

    public int TotalCapas { get; set; }
    public int OpenCapas { get; set; }
    public int ClosedCapas { get; set; }
    public int OverdueCapas { get; set; }

    public int TotalDispositions { get; set; }
    public Dictionary<string, int> DispositionsByType { get; set; } = new();

    public int TotalReworkRequests { get; set; }
    public decimal CompletedReworkQuantity { get; set; }

    public int TotalScrapRecords { get; set; }
    public decimal TotalScrapQuantity { get; set; }

    public Dictionary<string, int> DefectCategorySummary { get; set; } = new();
}
