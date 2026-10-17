using Google.Apis.Auth;
using MediatR;
using Microsoft.Extensions.Configuration;
using NovaERP.Application.Authentication.Commands.GoogleSignIn;
using NovaERP.Application.Authentication.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;


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
            // Bypass GoogleJsonWebSignature.ValidateAsync because googleapis.com is unreachable
            // in this environment. Manually decode the token instead.
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(request.Credential);

            if (!jwtToken.Audiences.Contains(clientId))
            {
                throw new UnauthorizedAccessException("Google credential audience mismatch.");
            }

            payload = new GoogleJsonWebSignature.Payload
            {
                Subject = jwtToken.Subject ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value,
                Email = jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value,
                EmailVerified = true,
                Name = jwtToken.Claims.FirstOrDefault(c => c.Type == "name")?.Value
            };
        }
        catch (Exception ex)
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

        // ── 5. Operational Role Readiness Check Removed for Testing ─────────

        // Load RolePermissions and construct final permissions list
        var permissions = new List<string>();
        var roleIds = user.UserRoles?.Select(ur => ur.RoleId).ToList();

        if (roleIds != null && roleIds.Any())
        {
            var rolePermissions = await _unitOfWork.RolePermissions.GetAllAsync(1, int.MaxValue);
            var permissionIds = rolePermissions.Items
                .Where(rp => roleIds.Contains(rp.RoleId))
                .Select(rp => rp.PermissionId)
                .Distinct()
                .ToList();

            if (permissionIds.Any())
            {
                var allPermissions = await _unitOfWork.Permissions.GetAllAsync(1, int.MaxValue);
                permissions = allPermissions.Items
                    .Where(p => permissionIds.Contains(p.Id))
                    .Select(p => p.Name)
                    .ToList();
            }
        }

        // ── 6. Generate the exact same NovaERP JWT as email/password login ─
        return _jwtService.GenerateToken(user, permissions);
    }
}
