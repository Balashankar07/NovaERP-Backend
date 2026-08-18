namespace NovaERP.Application.Features.Reports.DTOs;

public class ProcurementAttentionItemDto
{
    public string Reference { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public Guid ReferenceId { get; set; }
    public string ActionType { get; set; } = string.Empty;
}
