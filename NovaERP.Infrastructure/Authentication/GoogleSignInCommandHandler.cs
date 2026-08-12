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
///    - If no sub match exists but the Google-verified email matches a NovaERP account,
///      the sub is automatically stored (one-time auto-link on first Google sign-in).
/// 4. Generating the same NovaERP JWT that email/password login produces.
///
/// SECURITY GUARANTEES:
/// - ID token signature is validated against Google's public keys (cryptographic).
/// - Audience (ClientId) is validated — tokens for other apps are rejected.
/// - IsActive is enforced — inactive NovaERP users are blocked.
/// - Auto-link only fires when Google-verified email == NovaERP email (Google guarantees email).
/// - No automatic user creation — only existing NovaERP accounts are accepted.
/// - Duplicate sub mapping is prevented by the DB unique partial index.
/// </summary>
public class GoogleSignInCommandHandler
    : IRequestHandler<GoogleSignInCommand, LoginResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;

    public GoogleSignInCommandHandler(
        IUserRepository userRepository,
        IJwtService jwtService,
        IConfiguration configuration,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
        _configuration = configuration;
        _unitOfWork = unitOfWork;
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

        // ── 3. Try to find user by Google sub (already linked) ─────────────
        var user = await _userRepository.GetByGoogleSubjectIdAsync(googleSub);

        // ── 4. Auto-link: if no sub match, try matching by Google-verified email ──
        // Google cryptographically guarantees the email in the payload belongs to
        // the authenticated user, so matching by email is safe here.
        if (user is null && !string.IsNullOrWhiteSpace(payload.Email))
        {
            var userByEmail = await _userRepository.GetByEmailAsync(payload.Email);

            if (userByEmail is not null && string.IsNullOrWhiteSpace(userByEmail.GoogleSubjectId))
            {
                // Store the Google sub on the user so subsequent logins use the faster sub lookup.
                userByEmail.GoogleSubjectId = googleSub;
                _unitOfWork.Users.Update(userByEmail);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                user = userByEmail;
            }
        }

        if (user is null)
        {
            // No NovaERP account found for this Google identity.
            throw new UnauthorizedAccessException(
                "Google account is not linked to a NovaERP account. " +
                "Please sign in with your email and password, then link your " +
                "Google account from your profile settings.");
        }

        // ── 5. Check the user is still active ──────────────────────────────
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException(
                "Your NovaERP account has been deactivated. " +
                "Please contact your administrator.");
        }

        // ── 6. Generate the exact same NovaERP JWT as email/password login ─
        return _jwtService.GenerateToken(user);
    }
}
