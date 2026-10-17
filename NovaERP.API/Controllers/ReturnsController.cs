using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using System.Security.Claims;
using NovaERP.Application.DTOs.Returns;
using NovaERP.Application.Interfaces;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Enums;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReturnsController : ControllerBase
{
    private readonly IReturnsService _returnsService;
    private readonly ICurrentUserService _currentUserService;

    public ReturnsController(IReturnsService returnsService, ICurrentUserService currentUserService)
    {
        _returnsService = returnsService;
        _currentUserService = currentUserService;
    }

    #region Customer Returns

    [HttpGet]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetAllReturns([FromQuery] CustomerReturnStatus? status, [FromQuery] Guid? customerId)
    {
        var result = await _returnsService.GetAllReturnsAsync(status, customerId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetReturnById(Guid id)
    {
        var result = await _returnsService.GetReturnByIdAsync(id);
        if (result == null) return NotFound($"CustomerReturn {id} not found.");
        return Ok(result);
    }

    [HttpPost]
    [HasPermission("Permissions.Returns.Create")]
    public async Task<IActionResult> CreateReturn([FromBody] CreateCustomerReturnDto dto)
    {
        var result = await _returnsService.CreateReturnAsync(dto, _currentUserService.UserId);
        return CreatedAtAction(nameof(GetReturnById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Permissions.Returns.Create")]
    public async Task<IActionResult> UpdateReturn(Guid id, [FromBody] UpdateCustomerReturnDto dto)
    {
        var result = await _returnsService.UpdateReturnAsync(id, dto, _currentUserService.UserId);
        return Ok(result);
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("Permissions.Returns.Create")]
    public async Task<IActionResult> SubmitReturn(Guid id)
    {
        var result = await _returnsService.SubmitReturnAsync(id, _currentUserService.UserId);
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("Permissions.Returns.Approve")]
    public async Task<IActionResult> ApproveReturn(Guid id)
    {
        var result = await _returnsService.ApproveReturnAsync(id, _currentUserService.UserId);
        return Ok(result);
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("Permissions.Returns.Approve")]
    public async Task<IActionResult> RejectReturn(Guid id, [FromBody] RejectReturnRequest request)
    {
        var result = await _returnsService.RejectReturnAsync(id, request.Reason, _currentUserService.UserId);
        return Ok(result);
    }

    [HttpPost("{id:guid}/close")]
    [HasPermission("Permissions.Returns.Close")]
    public async Task<IActionResult> CloseReturn(Guid id)
    {
        var result = await _returnsService.CloseReturnAsync(id, _currentUserService.UserId);
        return Ok(result);
    }

    [HttpPost("{id:guid}/cancel")]
    [HasPermission("Permissions.Returns.Create")]
    public async Task<IActionResult> CancelReturn(Guid id)
    {
        var result = await _returnsService.CancelReturnAsync(id, _currentUserService.UserId);
        return Ok(result);
    }

    #endregion

    #region RMA Authorization

    [HttpGet("rmas")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetAllRmas([FromQuery] RmaStatus? status)
    {
        var result = await _returnsService.GetAllRmasAsync(status);
        return Ok(result);
    }

    [HttpGet("rmas/{id:guid}")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetRmaById(Guid id)
    {
        var result = await _returnsService.GetRmaByIdAsync(id);
        if (result == null) return NotFound($"RMA {id} not found.");
        return Ok(result);
    }

    [HttpPost("rmas")]
    [HasPermission("Permissions.Returns.Approve")]
    public async Task<IActionResult> CreateRma([FromBody] CreateRmaDto dto)
    {
        var result = await _returnsService.CreateRmaAsync(dto, _currentUserService.UserId);
        return CreatedAtAction(nameof(GetRmaById), new { id = result.Id }, result);
    }

    [HttpPost("rmas/{id:guid}/authorize")]
    [HasPermission("Permissions.Returns.Approve")]
    public async Task<IActionResult> AuthorizeRma(Guid id, [FromBody] AuthorizeRmaDto dto)
    {
        var result = await _returnsService.AuthorizeRmaAsync(id, dto, _currentUserService.UserId);
        return Ok(result);
    }

    #endregion

    #region Return Receipts

    [HttpGet("receipts")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetAllReceipts([FromQuery] Guid? customerReturnId)
    {
        var result = await _returnsService.GetAllReceiptsAsync(customerReturnId);
        return Ok(result);
    }

    [HttpGet("receipts/{id:guid}")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetReceiptById(Guid id)
    {
        var result = await _returnsService.GetReceiptByIdAsync(id);
        if (result == null) return NotFound($"ReturnReceipt {id} not found.");
        return Ok(result);
    }

    [HttpPost("receipts")]
    [HasPermission("Permissions.Returns.Receive")]
    public async Task<IActionResult> CreateReceipt([FromBody] CreateReturnReceiptDto dto)
    {
        var result = await _returnsService.CreateReceiptAsync(dto, _currentUserService.UserId);
        return CreatedAtAction(nameof(GetReceiptById), new { id = result.Id }, result);
    }

    #endregion

    #region Quality Dispositions

    [HttpGet("dispositions")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetAllDispositions([FromQuery] Guid? customerReturnId)
    {
        var result = await _returnsService.GetAllDispositionsAsync(customerReturnId);
        return Ok(result);
    }

    [HttpGet("dispositions/{id:guid}")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetDispositionById(Guid id)
    {
        var result = await _returnsService.GetDispositionByIdAsync(id);
        if (result == null) return NotFound($"ReturnDisposition {id} not found.");
        return Ok(result);
    }

    [HttpPost("dispositions")]
    [HasPermission("Permissions.Returns.Disposition")]
    public async Task<IActionResult> CreateDisposition([FromBody] CreateReturnDispositionDto dto)
    {
        var result = await _returnsService.CreateDispositionAsync(dto, _currentUserService.UserId);
        return CreatedAtAction(nameof(GetDispositionById), new { id = result.Id }, result);
    }

    [HttpPost("dispositions/{id:guid}/approve")]
    [HasPermission("Permissions.Returns.Disposition")]
    public async Task<IActionResult> ApproveDisposition(Guid id)
    {
        var result = await _returnsService.ApproveDispositionAsync(id, _currentUserService.UserId);
        return Ok(result);
    }

    #endregion

    #region Repairs

    [HttpGet("repairs")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetAllRepairs([FromQuery] Guid? customerReturnId)
    {
        var result = await _returnsService.GetAllRepairsAsync(customerReturnId);
        return Ok(result);
    }

    [HttpGet("repairs/{id:guid}")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetRepairById(Guid id)
    {
        var result = await _returnsService.GetRepairByIdAsync(id);
        if (result == null) return NotFound($"Repair {id} not found.");
        return Ok(result);
    }

    [HttpPost("repairs")]
    [HasPermission("Permissions.Returns.Repair")]
    public async Task<IActionResult> CreateRepair([FromBody] CreateRepairRequestDto dto)
    {
        var result = await _returnsService.CreateRepairAsync(dto, _currentUserService.UserId);
        return CreatedAtAction(nameof(GetRepairById), new { id = result.Id }, result);
    }

    [HttpPost("repairs/{id:guid}/approve")]
    [HasPermission("Permissions.Returns.Repair")]
    public async Task<IActionResult> ApproveRepair(Guid id)
    {
        var result = await _returnsService.ApproveRepairAsync(id, _currentUserService.UserId);
        return Ok(result);
    }

    [HttpPost("repairs/{id:guid}/start")]
    [HasPermission("Permissions.Returns.Repair")]
    public async Task<IActionResult> StartRepair(Guid id)
    {
        var result = await _returnsService.StartRepairAsync(id, _currentUserService.UserId);
        return Ok(result);
    }

    [HttpPost("repairs/{id:guid}/complete")]
    [HasPermission("Permissions.Returns.Repair")]
    public async Task<IActionResult> CompleteRepair(Guid id, [FromBody] CompleteRepairRequest request)
    {
        var result = await _returnsService.CompleteRepairAsync(id, request.RepairAction, request.ReinspectionPassed, _currentUserService.UserId);
        return Ok(result);
    }

    #endregion

    #region Replacements

    [HttpGet("replacements")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetAllReplacements([FromQuery] Guid? customerReturnId)
    {
        var result = await _returnsService.GetAllReplacementsAsync(customerReturnId);
        return Ok(result);
    }

    [HttpGet("replacements/{id:guid}")]
    [HasPermission("Permissions.Returns.View")]
    public async Task<IActionResult> GetReplacementById(Guid id)
    {
        var result = await _returnsService.GetReplacementByIdAsync(id);
        if (result == null) return NotFound($"ReplacementOrder {id} not found.");
        return Ok(result);
    }

    [HttpPost("replacements")]
    [HasPermission("Permissions.Returns.Replace")]
    public async Task<IActionResult> CreateReplacement([FromBody] CreateReplacementOrderDto dto)
    {
        var result = await _returnsService.CreateReplacementAsync(dto, _currentUserService.UserId);
        return CreatedAtAction(nameof(GetReplacementById), new { id = result.Id }, result);
    }

    [HttpPost("replacements/{id:guid}/ship")]
    [HasPermission("Permissions.Returns.Replace")]
    public async Task<IActionResult> ShipReplacement(Guid id, [FromBody] ShipReplacementRequest request)
    {
        var result = await _returnsService.ShipReplacementAsync(id, request.CourierName, request.TrackingNumber, _currentUserService.UserId);
        return Ok(result);
    }

    #endregion

    #region Summary Reports

    [HttpGet("reports/summary")]
    [HasPermission("Permissions.Returns.Reports.View")]
    public async Task<IActionResult> GetSummaryReport()
    {
        var result = await _returnsService.GetSummaryReportAsync();
        return Ok(result);
    }

    #endregion
}

public class RejectReturnRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class CompleteRepairRequest
{
    public string RepairAction { get; set; } = string.Empty;
    public bool ReinspectionPassed { get; set; } = true;
}

public class ShipReplacementRequest
{
    public string CourierName { get; set; } = string.Empty;
    public string TrackingNumber { get; set; } = string.Empty;
}
