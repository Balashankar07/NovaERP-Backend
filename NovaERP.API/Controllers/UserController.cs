using NovaERP.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Features.Users.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICurrentUserPermissionService _permissionService;

    public UserController(
        IUserService userService,
        ICurrentUserService currentUserService,
        ICurrentUserPermissionService permissionService)
    {
        _userService = userService;
        _currentUserService = currentUserService;
        _permissionService = permissionService;
    }

    [HttpGet]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortOrder = null)
    {
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", await _userService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder)));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var isSelf = _currentUserService.UserId == id;
        if (!isSelf && !await _permissionService.HasPermissionAsync("Permissions.Users.View"))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.ErrorResponse("You do not have permission to perform this action."));
        }

        var user = await _userService.GetByIdAsync(id);

        if (user == null)
            return NotFound(ApiResponse.ErrorResponse("Resource not found."));

        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", user));
    }

    [HttpPost]
    [HasPermission("Permissions.Users.Create")]
    public async Task<IActionResult> Create(CreateUserDto dto)
    {
        var user = await _userService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(Get),
            new { id = user.Id },
            ApiResponse.SuccessResponse("Operation completed successfully.", user));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateUserDto dto)
    {
        var isSelf = _currentUserService.UserId == id;
        if (!isSelf && !await _permissionService.HasPermissionAsync("Permissions.Users.Edit"))
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.ErrorResponse("You do not have permission to perform this action."));
        }

        if (isSelf)
        {
            var existingUser = await _userService.GetByIdAsync(id);
            if (existingUser != null)
            {
                dto.RoleIds = existingUser.RoleIds;
                dto.IsActive = existingUser.IsActive;
                if (dto.CompanyId == Guid.Empty && existingUser.CompanyId != Guid.Empty)
                {
                    dto.CompanyId = existingUser.CompanyId;
                }
            }
        }

        await _userService.UpdateAsync(id, dto);

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Permissions.Users.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _userService.DeleteAsync(id);

        return NoContent();
    }

    [HttpPost("bulk-delete")]
    [HasPermission("Permissions.Users.Delete")]
    public async Task<IActionResult> BulkDelete([FromBody] List<Guid> ids)
    {
        await _userService.BulkDeleteAsync(ids);
        return NoContent();
    }

    [HttpPatch("{id:guid}/activate")]
    [HasPermission("Permissions.Users.Edit")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound(ApiResponse.ErrorResponse("User not found."));
        
        await _userService.ActivateAsync(id);
        
        return Ok(ApiResponse.SuccessResponse("User activated successfully."));
    }

    [HttpPatch("{id:guid}/deactivate")]
    [HasPermission("Permissions.Users.Edit")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null) return NotFound(ApiResponse.ErrorResponse("User not found."));
        
        await _userService.DeactivateAsync(id);
        
        return Ok(ApiResponse.SuccessResponse("User deactivated successfully."));
    }

    [HttpGet("{id:guid}/roles")]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> GetRoles(Guid id)
    {
        var roles = await _userService.GetAssignedRolesAsync(id);
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", roles));
    }

    [HttpPost("{id:guid}/roles/{roleId:guid}")]
    [HasPermission("Permissions.Roles.Assign")]
    public async Task<IActionResult> AssignRole(Guid id, Guid roleId)
    {
        await _userService.AssignRolesAsync(id, new NovaERP.Application.Features.Users.DTOs.AssignRoleDto 
        { 
            UserId = id, 
            RoleIds = new List<Guid> { roleId } 
        });
        return Ok(ApiResponse.SuccessResponse("Role assigned successfully."));
    }

    [HttpDelete("{id:guid}/roles/{roleId:guid}")]
    [HasPermission("Permissions.Roles.Assign")]
    public async Task<IActionResult> RemoveRole(Guid id, Guid roleId)
    {
        await _userService.RemoveRoleAsync(id, roleId);
        return NoContent();
    }

    [HttpPost("{id:guid}/reset-password")]
    [HasPermission("Permissions.Users.Edit")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordDto dto)
    {
        return Ok(ApiResponse.SuccessResponse("Password reset email sent (simulated)."));
    }
}

public class ResetPasswordDto
{
    public string NewPassword { get; set; } = string.Empty;
}
