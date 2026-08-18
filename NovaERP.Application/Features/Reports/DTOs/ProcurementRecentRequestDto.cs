namespace NovaERP.Application.Features.Reports.DTOs;

public class ProcurementRecentRequestDto
{
    public Guid ReferenceId { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? RequiredByDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
