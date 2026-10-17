using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.BOMs.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BOMsController : ControllerBase
{
    private readonly IBOMService _bomService;

    public BOMsController(IBOMService bomService)
    {
        _bomService = bomService;
    }

    [HttpGet]
    [HasPermission("Permissions.BOMs.View")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortOrder = null)
    {
        var boms = await _bomService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", boms));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.BOMs.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var bom = await _bomService.GetByIdAsync(id);
        if (bom == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", bom));
    }

    [HttpPost]
    [HasPermission("Permissions.BOMs.Create")]
    public async Task<IActionResult> Create(CreateBOMDto dto)
    {
        try
        {
            var bom = await _bomService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = bom.Id }, ApiResponse.SuccessResponse("Operation completed successfully.", bom));
        }
        catch (DbUpdateException)
        {
            return Conflict(ApiResponse.ErrorResponse("A BOM with this version already exists, or a database constraint was violated."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Permissions.BOMs.Update")]
    public async Task<IActionResult> Update(Guid id, UpdateBOMDto dto)
    {
        try
        {
            var bom = await _bomService.UpdateAsync(id, dto);
            if (bom == null) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", bom));
        }
        catch (DbUpdateException)
        {
            return Conflict(ApiResponse.ErrorResponse("A BOM with this version already exists, or a database constraint was violated."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Permissions.BOMs.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _bomService.DeleteAsync(id);
            if (!deleted) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return Conflict(ApiResponse.ErrorResponse("This BOM cannot be deleted because it is referenced by other records."));
        }
    }

    [HttpPatch("{id:guid}/activate")]
    [HasPermission("Permissions.BOMs.Update")]
    public async Task<IActionResult> Activate(Guid id)
    {
        try
        {
            var activated = await _bomService.ActivateAsync(id);
            if (!activated) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
            return Ok(ApiResponse.SuccessResponse("BOM activated successfully."));
        }
        catch (DbUpdateException)
        {
            return Conflict(ApiResponse.ErrorResponse("Another BOM is already active and could not be deactivated concurrently."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
    }

    [HttpPatch("{id:guid}/deactivate")]
    [HasPermission("Permissions.BOMs.Update")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var deactivated = await _bomService.DeactivateAsync(id);
        if (!deactivated) return NotFound(ApiResponse.ErrorResponse("Resource not found."));
        return Ok(ApiResponse.SuccessResponse("BOM deactivated successfully."));
    }
}
