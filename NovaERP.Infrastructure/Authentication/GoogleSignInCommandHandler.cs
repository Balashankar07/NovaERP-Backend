using Google.Apis.Auth;
using MediatR;
using Microsoft.Extensions.Configuration;
using NovaERP.Application.Authentication.Commands.GoogleSignIn;
using NovaERP.Application.Authentication.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Application.Common.Helpers;

namespace NovaERP.Infrastructure.Authentication;

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

        var googleSub = payload.Subject;

        if (string.IsNullOrWhiteSpace(googleSub))
        {
            throw new UnauthorizedAccessException(
                "Google credential did not contain a valid subject identifier.");
        }

        // ── 2. Try to find user by Google sub (already linked) ─────────────
        var user = await _userRepository.GetByGoogleSubjectIdAsync(googleSub);

        // ── 3. Auto-link strictly by exact normalized email match ───────────
        if (user is null && !string.IsNullOrWhiteSpace(payload.Email))
        {
            var normalizedEmail = payload.Email.Trim().ToLowerInvariant();
            var userByEmail = await _userRepository.GetByEmailAsync(normalizedEmail);

            if (userByEmail is not null)
            {
                // If user exists but is linked to a DIFFERENT sub, reject.
                // Do not allow account takeover.
                if (!string.IsNullOrWhiteSpace(userByEmail.GoogleSubjectId) && userByEmail.GoogleSubjectId != googleSub)
                {
                    throw new UnauthorizedAccessException(
                        "This email is already linked to a different Google account. " +
                        "Please sign in with the original Google account used for this email.");
                }

                if (string.IsNullOrWhiteSpace(userByEmail.GoogleSubjectId))
                {
                    // Store the Google sub on the user so subsequent logins use the faster sub lookup.
                    userByEmail.GoogleSubjectId = googleSub;
                    _unitOfWork.Users.Update(userByEmail);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);

                    user = userByEmail;
                }
            }
        }

        if (user is null)
        {
            throw new UnauthorizedAccessException(
                "Google account is not provisioned in NovaERP. " +
                "Only the System Administrator can provision new users.");
        }

        // ── 4. Check the user is still active ──────────────────────────────
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException(
                "Your NovaERP account has been deactivated. " +
                "Please contact your administrator.");
        }

        // ── 5. Enforce Operational Role Readiness ──────────────────────────
        // A user MUST have at least ONE operationally ready role to log in via Google.
        bool hasOperationalRole = false;
        if (user.UserRoles != null && user.UserRoles.Any())
        {
            foreach (var ur in user.UserRoles)
            {
                var roleName = ur.Role?.Name ?? "";
                if (RoleReadinessEvaluator.Evaluate(roleName).IsOperationallyReady)
                {
                    hasOperationalRole = true;
                    break;
                }
            }
        }

        if (!hasOperationalRole)
        {
            throw new UnauthorizedAccessException(
                "Your assigned roles are not yet operational. " +
                "You cannot access the ERP system at this time.");
        }

        // ── 6. Generate the exact same NovaERP JWT as email/password login ─
        return _jwtService.GenerateToken(user);
    }
}
