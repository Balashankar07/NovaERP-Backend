using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.API.Extensions;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Warranties.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WarrantiesController : ControllerBase
{
    private readonly IWarrantyService _warrantyService;

    public WarrantiesController(IWarrantyService warrantyService)
    {
        _warrantyService = warrantyService;
    }

    [HttpGet]
    [HasPermission("Permissions.Warranties.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<WarrantyDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortOrder = null)
    {
        var result = await _warrantyService.GetAllWarrantiesAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(ApiResponse.SuccessResponse("Warranties retrieved successfully.", result));
    }

    [HttpGet("eligible-shipments")]
    [HasPermission("Permissions.Warranties.Create")]
    [ProducesResponseType(typeof(ApiResponse<List<EligibleShipmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEligibleShipments()
    {
        var result = await _warrantyService.GetEligibleShipmentsAsync();
        return Ok(ApiResponse.SuccessResponse("Eligible delivered shipments retrieved successfully.", result));
    }

    [HttpGet("next-serial-number")]
    [HasPermission("Permissions.Warranties.Create")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNextSerialNumber([FromQuery] Guid productId)
    {
        var result = await _warrantyService.GetNextSerialNumberAsync(productId);
        return Ok(ApiResponse.SuccessResponse("Next serial number generated successfully.", result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.Warranties.View")]
    [ProducesResponseType(typeof(ApiResponse<WarrantyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _warrantyService.GetWarrantyByIdAsync(id);
        return Ok(ApiResponse.SuccessResponse("Warranty retrieved successfully.", result));
    }

    [HttpPost]
    [HasPermission("Permissions.Warranties.Create")]
    [ProducesResponseType(typeof(ApiResponse<WarrantyDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateWarrantyDto request)
    {
        var result = await _warrantyService.CreateWarrantyAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse.SuccessResponse("Warranty created successfully.", result));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Permissions.Warranties.Update")]
    [ProducesResponseType(typeof(ApiResponse<WarrantyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWarrantyDto request)
    {
        var result = await _warrantyService.UpdateWarrantyAsync(id, request);
        return Ok(ApiResponse.SuccessResponse("Warranty updated successfully.", result));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Permissions.Warranties.Delete")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _warrantyService.DeleteWarrantyAsync(id);
        return Ok(ApiResponse.SuccessResponse("Warranty deleted successfully."));
    }

    [HttpPut("{id:guid}/close")]
    [HasPermission("Permissions.Warranties.Close")]
    [ProducesResponseType(typeof(ApiResponse<WarrantyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Close(Guid id)
    {
        var request = new UpdateWarrantyDto { Status = Domain.Enums.WarrantyStatus.Closed };
        var result = await _warrantyService.UpdateWarrantyAsync(id, request);
        return Ok(ApiResponse.SuccessResponse("Warranty closed successfully.", result));
    }
}
