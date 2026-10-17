using NovaERP.Domain.Enums;

namespace NovaERP.Application.DTOs.Returns;

public class CustomerReturnDto
{
    public Guid Id { get; set; }
    public string ReturnNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public Guid SalesOrderId { get; set; }
    public string SalesOrderNumber { get; set; } = string.Empty;
    public Guid? ShipmentId { get; set; }
    public string? ShipmentTrackingNumber { get; set; }
    public Guid? WarrantyClaimId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime RequestedDate { get; set; }
    public CustomerReturnStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? Notes { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<CustomerReturnItemDto> Items { get; set; } = new();
    public ReturnAuthorizationDto? RMA { get; set; }
    public List<ReturnReceiptDto> Receipts { get; set; } = new();
    public List<ReturnDispositionDto> Dispositions { get; set; } = new();
    public List<CustomerRepairRequestDto> Repairs { get; set; } = new();
    public List<ReplacementOrderDto> Replacements { get; set; } = new();
}

public class CustomerReturnItemDto
{
    public Guid Id { get; set; }
    public Guid CustomerReturnId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string? SerialNumber { get; set; }
    public string? BatchNumber { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ReturnItemCondition Condition { get; set; }
    public string ConditionName => Condition.ToString();
}

public class CreateCustomerReturnDto
{
    public Guid CustomerId { get; set; }
    public Guid SalesOrderId { get; set; }
    public Guid? ShipmentId { get; set; }
    public Guid? WarrantyClaimId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public List<CreateCustomerReturnItemDto> Items { get; set; } = new();
}

public class CreateCustomerReturnItemDto
{
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string? SerialNumber { get; set; }
    public string? BatchNumber { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ReturnItemCondition Condition { get; set; } = ReturnItemCondition.OpenedDefective;
}

public class UpdateCustomerReturnDto
{
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class ReturnAuthorizationDto
{
    public Guid Id { get; set; }
    public string RmaNumber { get; set; } = string.Empty;
    public Guid CustomerReturnId { get; set; }
    public string ReturnNumber { get; set; } = string.Empty;
    public Guid? AuthorizedByUserId { get; set; }
    public string? AuthorizedByName { get; set; }
    public DateTime AuthorizationDate { get; set; }
    public RmaStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? Reason { get; set; }
    public string? Instructions { get; set; }
}

public class CreateRmaDto
{
    public Guid CustomerReturnId { get; set; }
    public string? Instructions { get; set; }
}

public class AuthorizeRmaDto
{
    public bool Approve { get; set; }
    public string? Reason { get; set; }
    public string? Instructions { get; set; }
}

public class ReturnReceiptDto
{
    public Guid Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public Guid CustomerReturnId { get; set; }
    public string ReturnNumber { get; set; } = string.Empty;
    public Guid? ReturnAuthorizationId { get; set; }
    public string? RmaNumber { get; set; }
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public Guid? WarehouseLocationId { get; set; }
    public string? LocationName { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Guid? ReceivedByUserId { get; set; }
    public string? ReceivedByName { get; set; }
    public DateTime ReceivedDate { get; set; }
    public decimal Quantity { get; set; }
    public string? SerialNumber { get; set; }
    public string? BatchNumber { get; set; }
    public ReturnItemCondition Condition { get; set; }
    public string ConditionName => Condition.ToString();
    public string? Notes { get; set; }
    public Guid? QualityInspectionId { get; set; }
    public string? InspectionStatus { get; set; }
}

public class CreateReturnReceiptDto
{
    public Guid CustomerReturnId { get; set; }
    public Guid? ReturnAuthorizationId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid? WarehouseLocationId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string? SerialNumber { get; set; }
    public string? BatchNumber { get; set; }
    public ReturnItemCondition Condition { get; set; } = ReturnItemCondition.OpenedDefective;
    public string? Notes { get; set; }
    public bool TriggerQualityInspection { get; set; } = true;
}

public class ReturnDispositionDto
{
    public Guid Id { get; set; }
    public string DispositionNumber { get; set; } = string.Empty;
    public Guid CustomerReturnId { get; set; }
    public string ReturnNumber { get; set; } = string.Empty;
    public Guid ReturnReceiptId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public ReturnDispositionType DispositionType { get; set; }
    public string DispositionTypeName => DispositionType.ToString();
    public ReturnDispositionStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string Reason { get; set; } = string.Empty;
    public Guid? ApprovedByUserId { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public DateTime? ExecutedDate { get; set; }
    public string? Notes { get; set; }
}

public class CreateReturnDispositionDto
{
    public Guid CustomerReturnId { get; set; }
    public Guid ReturnReceiptId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public ReturnDispositionType DispositionType { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class CustomerRepairRequestDto
{
    public Guid Id { get; set; }
    public string RepairNumber { get; set; } = string.Empty;
    public Guid CustomerReturnId { get; set; }
    public string ReturnNumber { get; set; } = string.Empty;
    public Guid? ReturnAuthorizationId { get; set; }
    public string? RmaNumber { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public Guid? AssignedEmployeeId { get; set; }
    public string? AssignedEmployeeName { get; set; }
    public Guid? WorkCenterId { get; set; }
    public string? WorkCenterName { get; set; }
    public string FaultDescription { get; set; } = string.Empty;
    public string? RepairAction { get; set; }
    public ReturnRepairStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime? StartDate { get; set; }
    public DateTime? CompletionDate { get; set; }
    public Guid? ReinspectionId { get; set; }
    public string? ReinspectionStatus { get; set; }
    public string? Notes { get; set; }
}

public class CreateRepairRequestDto
{
    public Guid CustomerReturnId { get; set; }
    public Guid? ReturnAuthorizationId { get; set; }
    public Guid ProductId { get; set; }
    public string? SerialNumber { get; set; }
    public Guid? AssignedEmployeeId { get; set; }
    public Guid? WorkCenterId { get; set; }
    public string FaultDescription { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class ReplacementOrderDto
{
    public Guid Id { get; set; }
    public string ReplacementNumber { get; set; } = string.Empty;
    public Guid CustomerReturnId { get; set; }
    public string ReturnNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public ReplacementStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public Guid? ReservationId { get; set; }
    public Guid? ShipmentId { get; set; }
    public string? ShipmentTrackingNumber { get; set; }
    public string? Notes { get; set; }
}

public class CreateReplacementOrderDto
{
    public Guid CustomerReturnId { get; set; }
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public Guid WarehouseId { get; set; }
    public string? Notes { get; set; }
}

public class ReverseLogisticsSummaryDto
{
    public int TotalReturns { get; set; }
    public int PendingRmas { get; set; }
    public int ApprovedRmas { get; set; }
    public int TotalReceipts { get; set; }
    public int InRepairs { get; set; }
    public int CompletedRepairs { get; set; }
    public int ReplacementsIssued { get; set; }
    public decimal RestockedQuantity { get; set; }
    public decimal ScrappedQuantity { get; set; }

    public Dictionary<string, int> StatusBreakdown { get; set; } = new();
    public Dictionary<string, int> DispositionBreakdown { get; set; } = new();
    public Dictionary<string, int> ReasonBreakdown { get; set; } = new();
}
