using NovaERP.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Features.Permissions.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/admin/permissions")]
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

    [HttpGet("grouped")]
    [HasPermission("Permissions.Roles.View")]
    public async Task<IActionResult> GetGroupedPermissions()
    {
        var permissions = await _permissionService.GetPermissionsGroupedByModuleAsync();
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", permissions));
    }
}
