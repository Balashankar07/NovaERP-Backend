using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Shipments.DTOs;
using NovaERP.Application.Interfaces.Services;
using System.Security.Claims;

namespace NovaERP.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ShipmentsController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public ShipmentsController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }

    [HttpGet]
    [HasPermission("Permissions.Shipments.View")]
    public async Task<ActionResult<ApiResponse<PagedResult<ShipmentDto>>>> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortOrder = null)
    {
        var result = await _shipmentService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(ApiResponse.SuccessResponse("Shipments retrieved successfully.", result));
    }

    [HttpGet("{id}")]
    [HasPermission("Permissions.Shipments.View")]
    public async Task<ActionResult<ApiResponse<ShipmentDto>>> GetById(Guid id)
    {
        var shipment = await _shipmentService.GetByIdAsync(id);
        if (shipment == null)
            return NotFound(ApiResponse.ErrorResponse<ShipmentDto?>($"Shipment with ID {id} not found.", null));

        return Ok(ApiResponse.SuccessResponse("Shipment retrieved successfully.", shipment));
    }

    [HttpPost]
    // [HasPermission("Permissions.Shipments.Create")]
    public async Task<ActionResult<ApiResponse<ShipmentDto>>> Create([FromBody] CreateShipmentDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var shipment = await _shipmentService.CreateAsync(dto, currentUserId);
        
        // Auto-dispatch for seamless workflow
        await _shipmentService.DispatchAsync(shipment.Id, currentUserId);
        shipment = await _shipmentService.GetByIdAsync(shipment.Id);
        
        return CreatedAtAction(nameof(GetById), new { id = shipment?.Id }, ApiResponse.SuccessResponse("Shipment created successfully.", shipment));
    }

    [HttpPut("{id}")]
    [HasPermission("Permissions.Shipments.Update")]
    public async Task<ActionResult<ApiResponse<string>>> Update(Guid id, [FromBody] UpdateShipmentDto dto)
    {
        var currentUserId = GetCurrentUserId();
        await _shipmentService.UpdateAsync(id, dto, currentUserId);
        return Ok(ApiResponse.SuccessResponse("Shipment updated successfully."));
    }

    [HttpDelete("{id}")]
    [HasPermission("Permissions.Shipments.Delete")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        await _shipmentService.DeleteAsync(id, currentUserId);
        return Ok(ApiResponse.SuccessResponse("Shipment deleted successfully."));
    }

    [HttpPost("{id}/dispatch")]
    [HasPermission("Permissions.Shipments.Dispatch")]
    public async Task<ActionResult<ApiResponse<string>>> Dispatch(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        await _shipmentService.DispatchAsync(id, currentUserId);
        return Ok(ApiResponse.SuccessResponse("Shipment dispatched successfully."));
    }

    [HttpPost("{id}/deliver")]
    [HasPermission("Permissions.Shipments.Deliver")]
    public async Task<ActionResult<ApiResponse<string>>> Deliver(Guid id, [FromBody] DeliverShipmentDto dto)
    {
        var currentUserId = GetCurrentUserId();
        await _shipmentService.DeliverAsync(id, dto, currentUserId);
        return Ok(ApiResponse.SuccessResponse("Shipment delivered successfully."));
    }

    [HttpPost("{id}/cancel")]
    [HasPermission("Permissions.Shipments.Cancel")]
    public async Task<ActionResult<ApiResponse<string>>> Cancel(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        await _shipmentService.CancelAsync(id, currentUserId);
        return Ok(ApiResponse.SuccessResponse("Shipment cancelled successfully."));
    }
}
