using NovaERP.Application.DTOs.Returns;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Interfaces.Services;

public interface IReturnsService
{
    // Customer Returns
    Task<CustomerReturnDto> CreateReturnAsync(CreateCustomerReturnDto dto, Guid? currentUserId);
    Task<CustomerReturnDto?> GetReturnByIdAsync(Guid id);
    Task<IEnumerable<CustomerReturnDto>> GetAllReturnsAsync(CustomerReturnStatus? status = null, Guid? customerId = null);
    Task<CustomerReturnDto> UpdateReturnAsync(Guid id, UpdateCustomerReturnDto dto, Guid? currentUserId);
    Task<CustomerReturnDto> SubmitReturnAsync(Guid id, Guid? currentUserId);
    Task<CustomerReturnDto> ApproveReturnAsync(Guid id, Guid? currentUserId);
    Task<CustomerReturnDto> RejectReturnAsync(Guid id, string reason, Guid? currentUserId);
    Task<CustomerReturnDto> CloseReturnAsync(Guid id, Guid? currentUserId);
    Task<CustomerReturnDto> CancelReturnAsync(Guid id, Guid? currentUserId);

    // RMA Authorization
    Task<ReturnAuthorizationDto> CreateRmaAsync(CreateRmaDto dto, Guid? currentUserId);
    Task<ReturnAuthorizationDto> AuthorizeRmaAsync(Guid id, AuthorizeRmaDto dto, Guid? currentUserId);
    Task<ReturnAuthorizationDto?> GetRmaByIdAsync(Guid id);
    Task<IEnumerable<ReturnAuthorizationDto>> GetAllRmasAsync(RmaStatus? status = null);

    // Return Receipt
    Task<ReturnReceiptDto> CreateReceiptAsync(CreateReturnReceiptDto dto, Guid? currentUserId);
    Task<ReturnReceiptDto?> GetReceiptByIdAsync(Guid id);
    Task<IEnumerable<ReturnReceiptDto>> GetAllReceiptsAsync(Guid? customerReturnId = null);

    // Quality Disposition
    Task<ReturnDispositionDto> CreateDispositionAsync(CreateReturnDispositionDto dto, Guid? currentUserId);
    Task<ReturnDispositionDto> ApproveDispositionAsync(Guid id, Guid? currentUserId);
    Task<ReturnDispositionDto?> GetDispositionByIdAsync(Guid id);
    Task<IEnumerable<ReturnDispositionDto>> GetAllDispositionsAsync(Guid? customerReturnId = null);

    // Repairs
    Task<CustomerRepairRequestDto> CreateRepairAsync(CreateRepairRequestDto dto, Guid? currentUserId);
    Task<CustomerRepairRequestDto> ApproveRepairAsync(Guid id, Guid? currentUserId);
    Task<CustomerRepairRequestDto> StartRepairAsync(Guid id, Guid? currentUserId);
    Task<CustomerRepairRequestDto> CompleteRepairAsync(Guid id, string repairAction, bool reinspectionPassed, Guid? currentUserId);
    Task<CustomerRepairRequestDto?> GetRepairByIdAsync(Guid id);
    Task<IEnumerable<CustomerRepairRequestDto>> GetAllRepairsAsync(Guid? customerReturnId = null);

    // Replacements
    Task<ReplacementOrderDto> CreateReplacementAsync(CreateReplacementOrderDto dto, Guid? currentUserId);
    Task<ReplacementOrderDto> ShipReplacementAsync(Guid id, string courierName, string trackingNumber, Guid? currentUserId);
    Task<ReplacementOrderDto?> GetReplacementByIdAsync(Guid id);
    Task<IEnumerable<ReplacementOrderDto>> GetAllReplacementsAsync(Guid? customerReturnId = null);

    // Reverse Logistics Summary
    Task<ReverseLogisticsSummaryDto> GetSummaryReportAsync();
}
