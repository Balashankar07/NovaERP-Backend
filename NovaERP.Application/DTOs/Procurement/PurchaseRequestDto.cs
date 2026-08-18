using NovaERP.Domain.Enums;

namespace NovaERP.Application.DTOs.Procurement;

public class PurchaseRequestDto
{
    public Guid Id { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public string RequestedBy { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public DateTime RequestDate { get; set; }
    public DateTime RequiredByDate { get; set; }
    public PurchaseRequestPriority Priority { get; set; }
    public string Reason { get; set; } = string.Empty;
    public PurchaseRequestStatus Status { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public PurchaseRequestSource Source { get; set; }
    public Guid? SourceReferenceId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<PurchaseRequestItemDto> Items { get; set; } = new();
}

public class PurchaseRequestItemDto
{
    public Guid Id { get; set; }
    public Guid PurchaseRequestId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductNumber { get; set; } = string.Empty;
    public decimal RequestedQuantity { get; set; }
    public decimal ApprovedQuantity { get; set; }
    public decimal ConvertedQuantity { get; set; }
    public decimal RemainingQuantity { get; set; }
    public string? Remarks { get; set; }
}

public class CreatePurchaseRequestDto
{
    public DateTime RequiredByDate { get; set; }
    public PurchaseRequestPriority Priority { get; set; }
    public string Reason { get; set; } = string.Empty;
    public PurchaseRequestSource Source { get; set; }
    public Guid? SourceReferenceId { get; set; }
    
    public List<CreatePurchaseRequestItemDto> Items { get; set; } = new();
}

public class CreatePurchaseRequestItemDto
{
    public Guid ProductId { get; set; }
    public decimal RequestedQuantity { get; set; }
    public string? Remarks { get; set; }
}

public class UpdatePurchaseRequestDto
{
    public DateTime RequiredByDate { get; set; }
    public PurchaseRequestPriority Priority { get; set; }
    public string Reason { get; set; } = string.Empty;
    
    public List<CreatePurchaseRequestItemDto> Items { get; set; } = new();
}

public class RejectPurchaseRequestDto
{
    public string RejectionReason { get; set; } = string.Empty;
}
