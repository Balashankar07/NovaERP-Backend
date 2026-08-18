using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.ProductionPlans.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProductionPlansController : ControllerBase
{
    private readonly IProductionPlanService _productionPlanService;
    private readonly ICurrentUserService _currentUserService;

    public ProductionPlansController(IProductionPlanService productionPlanService, ICurrentUserService currentUserService)
    {
        _productionPlanService = productionPlanService;
        _currentUserService = currentUserService;
    }

    /// <summary>GET /api/ProductionPlans — Paginated list.</summary>
    [HttpGet]
    [HasPermission("Permissions.ProductionPlans.View")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortOrder = null)
    {
        var result = await _productionPlanService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(new ApiResponse<object>(true, "Production Plans retrieved successfully.", result));
    }

    /// <summary>GET /api/ProductionPlans/{id} — Single plan by ID.</summary>
    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.ProductionPlans.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var plan = await _productionPlanService.GetByIdAsync(id);
        if (plan == null)
            return NotFound(new ApiResponse<object>(false, "Production Plan not found.", null));

        return Ok(new ApiResponse<object>(true, "Production Plan retrieved successfully.", plan));
    }

    /// <summary>GET /api/ProductionPlans/{id}/requirements — Requirements for a plan.</summary>
    [HttpGet("{id:guid}/requirements")]
    [HasPermission("Permissions.ProductionPlans.View")]
    public async Task<IActionResult> GetRequirements(Guid id)
    {
        var requirements = await _productionPlanService.GetRequirementsAsync(id);
        return Ok(new ApiResponse<object>(true, "Production Requirements retrieved successfully.", requirements));
    }

    /// <summary>POST /api/ProductionPlans — Create a new plan.</summary>
    [HttpPost]
    [HasPermission("Permissions.ProductionPlans.Create")]
    public async Task<IActionResult> Create([FromBody] CreateProductionPlanDto dto)
    {
        var result = await _productionPlanService.CreateAsync(dto, _currentUserService.UserId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResponse<object>(true, "Production Plan created successfully.", result));
    }

    /// <summary>PUT /api/ProductionPlans/{id} — Update a draft plan.</summary>
    [HttpPut("{id:guid}")]
    [HasPermission("Permissions.ProductionPlans.Update")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductionPlanDto dto)
    {
        var result = await _productionPlanService.UpdateAsync(id, dto, _currentUserService.UserId);
        return Ok(new ApiResponse<object>(true, "Production Plan updated successfully.", result));
    }

    /// <summary>DELETE /api/ProductionPlans/{id} — Delete a draft plan.</summary>
    [HttpDelete("{id:guid}")]
    [HasPermission("Permissions.ProductionPlans.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _productionPlanService.DeleteAsync(id, _currentUserService.UserId);
        if (!success)
            return NotFound(new ApiResponse<object>(false, "Production Plan not found.", null));

        return Ok(new ApiResponse<object>(true, "Production Plan deleted successfully.", null));
    }

    [HttpPost("{id:guid}/release")]
    [HasPermission("Permissions.ProductionPlans.Release")]
    public async Task<IActionResult> Release(Guid id)
    {
        var result = await _productionPlanService.ReleaseAsync(id, _currentUserService.UserId);
        return Ok(new ApiResponse<object>(true, "Production Plan released successfully.", result));
    }

    /// <summary>POST /api/ProductionPlans/{id}/generate-pr — Generate PR for shortages.</summary>
    [HttpPost("{id:guid}/generate-pr")]
    [HasPermission("Permissions.ProductionPlans.Update")]
    public async Task<IActionResult> GeneratePR(Guid id)
    {
        var result = await _productionPlanService.GeneratePurchaseRequestAsync(id, _currentUserService.UserId);
        return Ok(new ApiResponse<object>(true, "Purchase Request generated successfully.", result));
    }
}
