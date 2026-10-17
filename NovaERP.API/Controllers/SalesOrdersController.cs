using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.Sales;
using NovaERP.Application.Interfaces;
using System.Security.Claims;

namespace NovaERP.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SalesOrdersController : ControllerBase
{
    private readonly ISalesOrderService _salesOrderService;

    public SalesOrdersController(ISalesOrderService salesOrderService)
    {
        _salesOrderService = salesOrderService;
    }

    [HttpGet]
    [HasPermission("Permissions.SalesOrders.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<SalesOrderDto>>>> GetSalesOrders(
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string? search = null, 
        [FromQuery] string? sortBy = null, 
        [FromQuery] string? sortOrder = null)
    {
        var result = await _salesOrderService.GetSalesOrdersAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpGet("{id}")]
    [HasPermission("Permissions.SalesOrders.View")]
    public async Task<ActionResult<ApiResponse<SalesOrderDto>>> GetSalesOrder(Guid id)
    {
        var result = await _salesOrderService.GetSalesOrderByIdAsync(id);
        return Ok(ApiResponse.SuccessResponse("Success", result));
    }

    [HttpPost]
    [HasPermission("Permissions.SalesOrders.Create")]
    public async Task<ActionResult<ApiResponse<SalesOrderDto>>> CreateSalesOrder([FromBody] CreateSalesOrderDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.CreateAsync(dto, userId);
        return CreatedAtAction(nameof(GetSalesOrder), new { id = result.Id }, ApiResponse.SuccessResponse("Sales Order created successfully", result));
    }

    [HttpPut("{id}")]
    [HasPermission("Permissions.SalesOrders.Update")]
    public async Task<ActionResult<ApiResponse<SalesOrderDto>>> UpdateSalesOrder(Guid id, [FromBody] UpdateSalesOrderDto dto)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.UpdateAsync(id, dto, userId);
        return Ok(ApiResponse.SuccessResponse("Sales Order updated successfully", result));
    }

    [HttpDelete("{id}")]
    [HasPermission("Permissions.SalesOrders.Delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSalesOrder(Guid id)
    {
        var userId = GetCurrentUserId();
        await _salesOrderService.DeleteAsync(id, userId);
        return Ok(ApiResponse.SuccessResponse("Sales Order deleted successfully", true));
    }

    [HttpPost("{id}/submit")]
    [HasPermission("Permissions.SalesOrders.Submit")]
    public async Task<ActionResult<ApiResponse<SalesOrderDto>>> SubmitSalesOrder(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.SubmitAsync(id, userId);
        return Ok(ApiResponse.SuccessResponse("Sales Order submitted for approval", result));
    }

    [HttpPost("{id}/approve")]
    [HasPermission("Permissions.SalesOrders.Approve")]
    public async Task<ActionResult<ApiResponse<SalesOrderDto>>> ApproveSalesOrder(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.ApproveAsync(id, userId);
        return Ok(ApiResponse.SuccessResponse("Sales Order approved successfully", result));
    }

    [HttpPost("{id}/reject")]
    [HasPermission("Permissions.SalesOrders.Approve")]
    public async Task<ActionResult<ApiResponse<SalesOrderDto>>> RejectSalesOrder(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.RejectAsync(id, userId);
        return Ok(ApiResponse.SuccessResponse("Sales Order rejected", result));
    }

    [HttpPost("{id}/reserve")]
    [HasPermission("Permissions.SalesOrders.Reserve")]
    public async Task<ActionResult<ApiResponse<SalesOrderDto>>> ReserveSalesOrder(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.ReserveAsync(id, userId);
        return Ok(ApiResponse.SuccessResponse("Sales Order reserved successfully", result));
    }

    [HttpPost("{id}/cancel")]
    [HasPermission("Permissions.SalesOrders.Cancel")]
    public async Task<ActionResult<ApiResponse<SalesOrderDto>>> CancelSalesOrder(Guid id, [FromQuery] string reason)
    {
        var userId = GetCurrentUserId();
        var result = await _salesOrderService.CancelAsync(id, reason, userId);
        return Ok(ApiResponse.SuccessResponse("Sales Order cancelled successfully", result));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
