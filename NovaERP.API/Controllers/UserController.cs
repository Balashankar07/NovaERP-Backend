using NovaERP.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.Features.Users.DTOs;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null, [FromQuery] string? sortOrder = null)
    {
        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", await _userService.GetAllAsync(pageNumber, pageSize, search, sortBy, sortOrder)));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Permissions.Users.View")]
    public async Task<IActionResult> Get(Guid id)
    {
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
    [HasPermission("Permissions.Users.Edit")]
    public async Task<IActionResult> Update(Guid id, UpdateUserDto dto)
    {
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
}