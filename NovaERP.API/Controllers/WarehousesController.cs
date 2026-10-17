using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Warehouses.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WarehousesController : ControllerBase
{
    private readonly IWarehouseService _warehouseService;

    public WarehousesController(IWarehouseService warehouseService)
    {
        _warehouseService = warehouseService;
    }

    [HttpGet]
    // [HasPermission("Permissions.Warehouses.View")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortOrder = null)
    {
        var result = await _warehouseService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(new ApiResponse<object>(true, "Warehouses retrieved successfully.", result));
    }

    [HttpGet("{id}")]
    [HasPermission("Permissions.Warehouses.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var warehouse = await _warehouseService.GetByIdAsync(id);
        if (warehouse == null)
            return NotFound(new ApiResponse<object>(false, "Warehouse not found.", null));

        return Ok(new ApiResponse<object>(true, "Warehouse retrieved successfully.", warehouse));
    }

    [HttpPost]
    [HasPermission("Permissions.Warehouses.Create")]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseDto dto)
    {
        var warehouse = await _warehouseService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = warehouse.Id }, new ApiResponse<object>(true, "Warehouse created successfully.", warehouse));
    }

    [HttpPut("{id}")]
    [HasPermission("Permissions.Warehouses.Update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWarehouseDto dto)
    {
        var warehouse = await _warehouseService.UpdateAsync(id, dto);
        if (warehouse == null)
            return NotFound(new ApiResponse<object>(false, "Warehouse not found.", null));

        return Ok(new ApiResponse<object>(true, "Warehouse updated successfully.", warehouse));
    }

    [HttpDelete("{id}")]
    [HasPermission("Permissions.Warehouses.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _warehouseService.DeleteAsync(id);
        if (!result)
            return NotFound(new ApiResponse<object>(false, "Warehouse not found.", null));

        return Ok(new ApiResponse<object>(true, "Warehouse deleted successfully.", null));
    }
}
