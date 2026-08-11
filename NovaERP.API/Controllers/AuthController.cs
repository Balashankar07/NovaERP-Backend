using NovaERP.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.Application.Authentication.Commands.Login;
using NovaERP.Application.Authentication.Commands.GoogleSignIn;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Application.Interfaces.Repositories;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly ICurrentUserPermissionService _permissionService;
    private readonly IUnitOfWork _unitOfWork;

    public AuthController(
        IMediator mediator,
        ICurrentUserService currentUser,
        ICurrentUserPermissionService permissionService,
        IUnitOfWork unitOfWork)
    {
        _mediator = mediator;
        _currentUser = currentUser;
        _permissionService = permissionService;
        _unitOfWork = unitOfWork;
    }

    // ──────────────────────────────────────────────────────────────────────
    // EXISTING — Email / Password Login (UNCHANGED)
    // ──────────────────────────────────────────────────────────────────────

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginCommand command)
    {
        var result = await _mediator.Send(command);

        return Ok(ApiResponse.SuccessResponse("Operation completed successfully.", result));
    }

    // ──────────────────────────────────────────────────────────────────────
    // EXISTING — Current User Info (UNCHANGED)
    // ──────────────────────────────────────────────────────────────────────

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

    // ──────────────────────────────────────────────────────────────────────
    // NEW — Google Sign-In
    // Accepts a Google ID token (credential) from the frontend's GoogleLogin
    // component, validates it cryptographically, then returns the same
    // NovaERP JWT that email/password login produces.
    //
    // Security:
    //   • ID token validated against Google's public keys (no secret needed).
    //   • Audience (ClientId) is verified.
    //   • Only users with a linked GoogleSubjectId are accepted.
    //   • IsActive is enforced.
    //   • No automatic user creation.
    // ──────────────────────────────────────────────────────────────────────

    [HttpPost("google-signin")]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInCommand command)
    {
        var result = await _mediator.Send(command);

        return Ok(ApiResponse.SuccessResponse("Google sign-in successful.", result));
    }

    // ──────────────────────────────────────────────────────────────────────
    // NEW — Link Google Account (requires existing NovaERP JWT)
    // One-time account linking flow via the Profile page:
    //   1. User is authenticated via email/password (has a valid NovaERP JWT).
    //   2. Clicks "Connect Google Account" → Google popup → credential returned.
    //   3. This endpoint validates the credential and stores the Google sub
    //      on the current user's existing database record.
    //
    // Security:
    //   • [Authorize] required — caller must have a valid NovaERP JWT.
    //   • ID token validated cryptographically.
    //   • Prevents linking a Google account already mapped to another user.
    //   • Idempotent — re-linking same Google account returns success.
    //   • Does NOT modify User.Id, roles, permissions, or IsActive state.
    // ──────────────────────────────────────────────────────────────────────

    [Authorize]
    [HttpPost("link-google")]
    public async Task<IActionResult> LinkGoogle([FromBody] LinkGoogleRequest request)
    {
        var userId = _currentUser.UserId;

        if (userId == Guid.Empty)
            return Unauthorized(ApiResponse.ErrorResponse(
                "User identity could not be resolved."));

        // ── Validate the Google ID token ───────────────────────────────────
        var clientId = HttpContext.RequestServices
            .GetRequiredService<IConfiguration>()["Google:ClientId"];

        if (string.IsNullOrWhiteSpace(clientId))
            return StatusCode(500, ApiResponse.ErrorResponse(
                "Google Sign-In is not configured on this server."));

        Google.Apis.Auth.GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new Google.Apis.Auth.GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };

            payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(
                request.Credential, settings);
        }
        catch (Google.Apis.Auth.InvalidJwtException)
        {
            return Unauthorized(ApiResponse.ErrorResponse(
                "Google credential validation failed. The token is invalid or expired."));
        }

        var googleSub = payload.Subject;

        if (string.IsNullOrWhiteSpace(googleSub))
            return Unauthorized(ApiResponse.ErrorResponse(
                "Google credential did not contain a valid subject identifier."));

        // ── Check the Google sub is not already linked to a DIFFERENT user ─
        var existingLinkedUser = await _unitOfWork.Users.GetByGoogleSubjectIdAsync(googleSub);

        if (existingLinkedUser is not null && existingLinkedUser.Id != userId)
        {
            return Conflict(ApiResponse.ErrorResponse(
                "This Google account is already linked to another NovaERP account."));
        }

        // ── Idempotent: already linked to THIS user ────────────────────────
        if (existingLinkedUser?.Id == userId)
        {
            return Ok(ApiResponse.SuccessResponse(
                "Google account is already linked to your account.", new { }));
        }

        // ── Load the current user record and set GoogleSubjectId ───────────
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user is null)
            return NotFound(ApiResponse.ErrorResponse("User not found."));

        user.GoogleSubjectId = googleSub;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse.SuccessResponse(
            $"Google account ({payload.Email}) linked successfully to your NovaERP account.",
            new { googleEmail = payload.Email }));
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Request DTO for link-google endpoint
// ──────────────────────────────────────────────────────────────────────────────

/// <summary>
/// The Credential is the Google ID token string from @react-oauth/google's
/// GoogleLogin component. It is a JWT signed by Google.
/// </summary>
public class LinkGoogleRequest
{
    public string Credential { get; set; } = string.Empty;
}