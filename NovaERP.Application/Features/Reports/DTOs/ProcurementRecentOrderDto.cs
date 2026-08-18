namespace NovaERP.Application.Features.Reports.DTOs;

public class ProcurementRecentOrderDto
{
    public Guid ReferenceId { get; set; }
    public string PONumber { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ExpectedDeliveryDate { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
}
