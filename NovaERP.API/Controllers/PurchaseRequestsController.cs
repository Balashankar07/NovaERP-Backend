using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.Procurement;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/purchase-requests")]
[Authorize]
public class PurchaseRequestsController : ControllerBase
{
    private readonly IPurchaseRequestService _purchaseRequestService;

    public PurchaseRequestsController(IPurchaseRequestService purchaseRequestService)
    {
        _purchaseRequestService = purchaseRequestService;
    }

    [HttpGet]
    [HasPermission("Permissions.PurchaseOrders.View")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortOrder = null, [FromQuery] string? status = null, [FromQuery] string? priority = null, [FromQuery] string? source = null)
    {
        var result = await _purchaseRequestService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder, status, priority, source);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [HttpGet("{id}")]
    [HasPermission("Permissions.PurchaseOrders.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _purchaseRequestService.GetByIdAsync(id);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [HttpPost]
    [HasPermission("Permissions.PurchaseOrders.Create")]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseRequestDto dto)
    {
        var result = await _purchaseRequestService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [HttpPut("{id}")]
    [HasPermission("Permissions.PurchaseOrders.Update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePurchaseRequestDto dto)
    {
        var result = await _purchaseRequestService.UpdateAsync(id, dto);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [HttpDelete("{id}")]
    [HasPermission("Permissions.PurchaseOrders.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _purchaseRequestService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/submit")]
    [HasPermission("Permissions.PurchaseOrders.Submit")]
    public async Task<IActionResult> Submit(Guid id)
    {
        var result = await _purchaseRequestService.SubmitAsync(id);
        return Ok(ApiResponse.SuccessResponse("Request submitted.", result));
    }

    [HttpPost("{id}/approve")]
    [HasPermission("Permissions.PurchaseOrders.Approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var result = await _purchaseRequestService.ApproveAsync(id);
        return Ok(ApiResponse.SuccessResponse("Request approved.", result));
    }

    [HttpPost("{id}/reject")]
    [HasPermission("Permissions.PurchaseOrders.Reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectPurchaseRequestDto dto)
    {
        var result = await _purchaseRequestService.RejectAsync(id, dto);
        return Ok(ApiResponse.SuccessResponse("Request rejected.", result));
    }
}
