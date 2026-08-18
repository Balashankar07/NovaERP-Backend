namespace NovaERP.Application.Features.Reports.DTOs;

public class ProcurementUpcomingReceiptDto
{
    public Guid ReferenceId { get; set; }
    public string PONumber { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public DateTime ExpectedDeliveryDate { get; set; }
    public decimal OutstandingQuantity { get; set; }
    public decimal TotalValue { get; set; }
    public string Status { get; set; } = string.Empty;
}
