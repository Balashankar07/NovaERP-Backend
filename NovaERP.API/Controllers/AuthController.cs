using NovaERP.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.Application.Authentication.Commands.Login;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly ICurrentUserPermissionService _permissionService;

    public AuthController(
        IMediator mediator,
        ICurrentUserService currentUser,
        ICurrentUserPermissionService permissionService)
    {
        _mediator = mediator;
        _currentUser = currentUser;
        _permissionService = permissionService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginCommand command)
    {
        var result = await _mediator.Send(command);

        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var permissions = await _permissionService.GetUserPermissionsAsync();

        var data = new
        {
            _currentUser.IsAuthenticated,
            _currentUser.UserId,
            _currentUser.Email,
            _currentUser.Role,
            _currentUser.CompanyId,
            _currentUser.BranchId,
            Permissions = permissions
        };
        return Ok(ApiResponse.SuccessResponse("Current user retrieved successfully.", data));
    }
}