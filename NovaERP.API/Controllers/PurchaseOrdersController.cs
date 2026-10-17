using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.PurchaseOrders.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _purchaseOrderService;

    public PurchaseOrdersController(IPurchaseOrderService purchaseOrderService)
    {
        _purchaseOrderService = purchaseOrderService;
    }

    [HttpGet]
    [HasPermission("Permissions.PurchaseOrders.View")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortOrder = null)
    {
        var pos = await _purchaseOrderService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", pos));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.PurchaseOrders.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var po = await _purchaseOrderService.GetByIdAsync(id);
        if (po == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", po));
    }

    [HttpGet("{id:guid}/items")]
    [HasPermission("Permissions.PurchaseOrders.View")]
    public async Task<IActionResult> GetItems(Guid id)
    {
        var po = await _purchaseOrderService.GetByIdAsync(id);
        if (po == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", po.Items));
    }

    [HttpPost]
    [HasPermission("Permissions.PurchaseOrders.Create")]
    public async Task<IActionResult> Create(CreatePurchaseOrderDto dto)
    {
        try
        {
            var po = await _purchaseOrderService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = po.Id }, ApiResponse.SuccessResponse("Operation completed successfully.", po));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Permissions.PurchaseOrders.Update")]
    public async Task<IActionResult> Update(Guid id, UpdatePurchaseOrderDto dto)
    {
        try
        {
            var po = await _purchaseOrderService.UpdateAsync(id, dto);
            if (po == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", po));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Permissions.PurchaseOrders.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _purchaseOrderService.DeleteAsync(id);
            if (!deleted) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id:guid}/submit")]
    [HasPermission("Permissions.PurchaseOrders.Submit")]
    public async Task<IActionResult> Submit(Guid id)
    {
        try
        {
            var po = await _purchaseOrderService.SubmitAsync(id);
            if (po == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return Ok(ApiResponse.SuccessResponse("Order submitted for approval.", po));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id:guid}/approve")]
    [HasPermission("Permissions.PurchaseOrders.Approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        try
        {
            var po = await _purchaseOrderService.ApproveAsync(id);
            if (po == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return Ok(ApiResponse.SuccessResponse("Order approved.", po));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id:guid}/reject")]
    [HasPermission("Permissions.PurchaseOrders.Reject")]
    public async Task<IActionResult> Reject(Guid id)
    {
        try
        {
            var po = await _purchaseOrderService.RejectAsync(id);
            if (po == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return Ok(ApiResponse.SuccessResponse("Order rejected.", po));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id:guid}/send")]
    [HasPermission("Permissions.PurchaseOrders.Submit")]
    public async Task<IActionResult> Send(Guid id)
    {
        try
        {
            var po = await _purchaseOrderService.SendAsync(id);
            if (po == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return Ok(ApiResponse.SuccessResponse("Order sent.", po));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }
}
