using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Suppliers.DTOs;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Enums;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/supplier-products")]
[Authorize]
public class SupplierProductsController : ControllerBase
{
    private readonly ISupplierProductService _supplierProductService;

    public SupplierProductsController(ISupplierProductService supplierProductService)
    {
        _supplierProductService = supplierProductService;
    }

    [HttpGet]
    [HasPermission("Permissions.Suppliers.View")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortOrder = null)
    {
        var result = await _supplierProductService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.Suppliers.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _supplierProductService.GetByIdAsync(id);
        if (result == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }
    
    [HttpGet("supplier/{supplierId:guid}")]
    [HasPermission("Permissions.Suppliers.View")]
    public async Task<IActionResult> GetBySupplierId(Guid supplierId)
    {
        var result = await _supplierProductService.GetBySupplierIdAsync(supplierId);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }
    
    [HttpGet("product/{productId:guid}")]
    [HasPermission("Permissions.Suppliers.View")]
    public async Task<IActionResult> GetByProductId(Guid productId)
    {
        var result = await _supplierProductService.GetByProductIdAsync(productId);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [HttpPost]
    [HasPermission("Permissions.Suppliers.Create")]
    public async Task<IActionResult> Create([FromBody] CreateSupplierProductDto dto)
    {
        try
        {
            var result = await _supplierProductService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse.SuccessResponse("Operation completed successfully.", result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Permissions.Suppliers.Update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupplierProductDto dto)
    {
        try
        {
            var result = await _supplierProductService.UpdateAsync(id, dto);
            if (result == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Permissions.Suppliers.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _supplierProductService.DeleteAsync(id);
        if (!success) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
        return NoContent();
    }
}
