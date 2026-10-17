using NovaERP.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Features.Roles.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/admin/roles")]
[Authorize]
public class RoleController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RoleController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [HasPermission("Permissions.Roles.View")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortOrder = null)
    {
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", await _roleService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder)));
    }

    [HttpGet("{id}")]
    [HasPermission("Permissions.Roles.View")]
    public async Task<IActionResult> Get(Guid id)
    {
        var role = await _roleService.GetByIdAsync(id);

        if (role == null)
            return NotFound(ApiResponse.ErrorResponse("Resource not found."));

        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", role));
    }

    [HttpPost]
    [HasPermission("Permissions.Roles.Create")]
    public async Task<IActionResult> Create(CreateRoleDto dto)
    {
        var role = await _roleService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(Get),
            new { id = role.Id },
            ApiResponse.SuccessResponse("Operation completed successfully.", role));
    }

    [HttpPut("{id}")]
    [HasPermission("Permissions.Roles.Edit")]
    public async Task<IActionResult> Update(Guid id, UpdateRoleDto dto)
    {
        await _roleService.UpdateAsync(id, dto);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [HasPermission("Permissions.Roles.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _roleService.DeleteAsync(id);

        return NoContent();
    }

    [HttpPost("bulk-delete")]
    [HasPermission("Permissions.Roles.Delete")]
    public async Task<IActionResult> BulkDelete([FromBody] List<Guid> ids)
    {
        await _roleService.BulkDeleteAsync(ids);
        return NoContent();
    }

    [HttpPatch("{id:guid}/activate")]
    [HasPermission("Permissions.Roles.Edit")]
    public async Task<IActionResult> Activate(Guid id)
    {
        await _roleService.ActivateAsync(id);
        return Ok(ApiResponse.SuccessResponse("Role activated successfully."));
    }

    [HttpPatch("{id:guid}/deactivate")]
    [HasPermission("Permissions.Roles.Edit")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        await _roleService.DeactivateAsync(id);
        return Ok(ApiResponse.SuccessResponse("Role deactivated successfully."));
    }

    [HttpGet("{id:guid}/users")]
    [HasPermission("Permissions.Roles.View")]
    public async Task<IActionResult> GetUsers(Guid id)
    {
        var users = await _roleService.GetAssignedUsersAsync(id);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", users));
    }

    [HttpGet("{id:guid}/permissions")]
    [HasPermission("Permissions.Roles.View")]
    public async Task<IActionResult> GetPermissions(Guid id)
    {
        var permissions = await _roleService.GetAssignedPermissionsAsync(id);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", permissions));
    }

    [HttpPost("{id:guid}/permissions")]
    [HasPermission("Permissions.Roles.Edit")]
    public async Task<IActionResult> AssignPermissions(Guid id, [FromBody] List<Guid> permissionIds)
    {
        await _roleService.AssignPermissionsAsync(id, new NovaERP.Application.Features.Roles.DTOs.AssignPermissionDto 
        { 
            RoleId = id, 
            PermissionIds = permissionIds 
        });
        return Ok(ApiResponse.SuccessResponse("Permissions assigned successfully."));
    }

    [HttpPost("{id:guid}/permissions/{permissionId:guid}")]
    [HasPermission("Permissions.Roles.Edit")]
    public async Task<IActionResult> AssignPermission(Guid id, Guid permissionId)
    {
        await _roleService.AssignPermissionsAsync(id, new NovaERP.Application.Features.Roles.DTOs.AssignPermissionDto 
        { 
            RoleId = id, 
            PermissionIds = new List<Guid> { permissionId } 
        });
        return Ok(ApiResponse.SuccessResponse("Permission assigned successfully."));
    }

    [HttpDelete("{id:guid}/permissions/{permissionId:guid}")]
    [HasPermission("Permissions.Roles.Edit")]
    public async Task<IActionResult> RemovePermission(Guid id, Guid permissionId)
    {
        await _roleService.RemovePermissionAsync(id, permissionId);
        return NoContent();
    }
}