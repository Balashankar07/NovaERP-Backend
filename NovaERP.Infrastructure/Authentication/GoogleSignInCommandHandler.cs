using Google.Apis.Auth;
using MediatR;
using Microsoft.Extensions.Configuration;
using NovaERP.Application.Authentication.Commands.GoogleSignIn;
using NovaERP.Application.Authentication.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;

namespace NovaERP.Infrastructure.Authentication;

/// <summary>
/// Handles Google Sign-In by:
/// 1. Cryptographically validating the Google ID token (no network call to Google needed).
/// 2. Extracting the stable Google "sub" identifier.
/// 3. Finding the existing NovaERP user linked to that sub.
/// 4. Generating the same NovaERP JWT that email/password login produces.
///
/// Lives in Infrastructure (not Application) because it depends on
/// Google.Apis.Auth which is an Infrastructure-layer NuGet package.
///
/// SECURITY GUARANTEES:
/// - ID token signature is validated against Google's public keys (cryptographic).
/// - Audience (ClientId) is validated — tokens for other apps are rejected.
/// - IsActive is enforced — inactive NovaERP users are blocked.
/// - No automatic user creation — only pre-linked accounts are accepted.
/// - Duplicate sub mapping is prevented by the DB unique partial index.
/// </summary>
public class GoogleSignInCommandHandler
    : IRequestHandler<GoogleSignInCommand, LoginResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;

    public GoogleSignInCommandHandler(
        IUserRepository userRepository,
        IJwtService jwtService,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> Handle(
        GoogleSignInCommand request,
        CancellationToken cancellationToken)
    {
        var clientId = _configuration["Google:ClientId"];

        if (string.IsNullOrWhiteSpace(clientId) ||
            clientId == "REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID")
        {
            throw new InvalidOperationException(
                "Google:ClientId is not configured. " +
                "Set it in appsettings.json or via environment variable Google__ClientId.");
        }

        // ── 1. Validate the Google ID token cryptographically ──────────────
        // GoogleJsonWebSignature.ValidateAsync checks:
        //   • Token signature against Google's public keys
        //   • Token expiry
        //   • Audience matches our configured ClientId
        // No Google Client Secret is required for this validation.
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };

            payload = await GoogleJsonWebSignature.ValidateAsync(
                request.Credential, settings);
        }
        catch (InvalidJwtException ex)
        {
            throw new UnauthorizedAccessException(
                "Google credential validation failed. The token is invalid or expired.", ex);
        }

        // ── 2. Extract the stable Google subject identifier ─────────────────
        var googleSub = payload.Subject;

        if (string.IsNullOrWhiteSpace(googleSub))
        {
            throw new UnauthorizedAccessException(
                "Google credential did not contain a valid subject identifier.");
        }

        // ── 3. Find the existing NovaERP user linked to this Google sub ─────
        var user = await _userRepository.GetByGoogleSubjectIdAsync(googleSub);

        if (user is null)
        {
            // SECURITY: Do NOT create a new user. Do NOT auto-register.
            throw new UnauthorizedAccessException(
                "Google account is not linked to a NovaERP account. " +
                "Please sign in with your email and password, then link your " +
                "Google account from your profile settings.");
        }

        // ── 4. Check the user is still active ──────────────────────────────
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException(
                "Your NovaERP account has been deactivated. " +
                "Please contact your administrator.");
        }

        // ── 5. Generate the exact same NovaERP JWT as email/password login ─
        // JwtService.GenerateToken populates UserId, Email, Role claims.
        // CurrentUserPermissionService and RBAC pipeline are completely unaffected.
        return _jwtService.GenerateToken(user);
    }
}
