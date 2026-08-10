using NovaERP.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Features.Permissions.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;

    public PermissionsController(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    [HttpGet]
    [HasPermission("Permissions.Roles.View")]
    public async Task<IActionResult> GetAllPermissions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortOrder = null)
    {
        var permissions = await _permissionService.GetAllPermissionsAsync(pageNumber, pageSize, search, sortBy, sortOrder);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", permissions));
    }

    [HttpGet("role/{roleId}")]
    [HasPermission("Permissions.Roles.View")]
    public async Task<IActionResult> GetRolePermissions(Guid roleId)
    {
        var permissions = await _permissionService.GetRolePermissionsAsync(roleId);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", permissions));
    }

    [HttpPost("role/{roleId}")]
    [HasPermission("Permissions.Roles.Edit")]
    public async Task<IActionResult> AssignPermissionsToRole(Guid roleId, [FromBody] RolePermissionDto dto)
    {
        if (roleId != dto.RoleId)
        {
            return BadRequest(ApiResponse.ErrorResponse("Role ID in URL must match Role ID in body."));
        }

        try
        {
            await _permissionService.AssignPermissionsToRoleAsync(roleId, dto.PermissionIds);
            return Ok(ApiResponse.SuccessResponse("Operation completed successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
