using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Admin.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("overview")]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> GetOverview()
    {
        var overview = await _adminService.GetOverviewAsync();
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", overview));
    }

    [HttpGet("security")]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> GetSecurityOverview()
    {
        var security = await _adminService.GetSecurityOverviewAsync();
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", security));
    }

    [HttpGet("module-status")]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> GetModuleStatuses()
    {
        var statuses = await _adminService.GetModuleStatusesAsync();
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", statuses));
    }

    [HttpGet("system/health")]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> GetSystemHealth()
    {
        var health = await _adminService.GetSystemHealthAsync();
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", health));
    }

    [HttpGet("system/config")]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> GetSystemConfig()
    {
        var config = await _adminService.GetSystemConfigurationAsync();
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", config));
    }

    [HttpGet("system/info")]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> GetSystemInfo()
    {
        var info = await _adminService.GetSystemInfoAsync();
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", info));
    }

    [HttpGet("permissions/matrix")]
    [HasPermission("Permissions.Roles.View")]
    public async Task<IActionResult> GetPermissionMatrix()
    {
        var matrix = await _adminService.GetPermissionMatrixAsync();
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", matrix));
    }

    [HttpPost("permissions/matrix/toggle")]
    [HasPermission("Permissions.Roles.Edit")]
    public async Task<IActionResult> TogglePermission([FromBody] ToggleRolePermissionDto dto)
    {
        await _adminService.ToggleRolePermissionAsync(dto);
        return Ok(ApiResponse.SuccessResponse("Permission updated successfully."));
    }
}
