namespace NovaERP.Application.Features.Reports.DTOs;

public class ProcurementSummaryDto
{
    public int PendingPurchaseRequests { get; set; }
    public int AwaitingApproval { get; set; }
    public int OpenPurchaseOrders { get; set; }
    public int PendingReceipts { get; set; }
    public int OverdueReceipts { get; set; }
    public decimal TotalProcurementValue { get; set; }

    public List<ProcurementAttentionItemDto> NeedsAttention { get; set; } = new();
    public List<ProcurementUpcomingReceiptDto> UpcomingReceipts { get; set; } = new();
    public List<ProcurementRecentRequestDto> RecentRequests { get; set; } = new();
    public List<ProcurementRecentOrderDto> RecentOrders { get; set; } = new();
}
