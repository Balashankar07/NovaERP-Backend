using MediatR;
using NovaERP.Application.Authentication.DTOs;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;

namespace NovaERP.Application.Authentication.Commands.Login;

public class LoginCommandHandler
    : IRequestHandler<LoginCommand, LoginResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IUnitOfWork _unitOfWork;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtService jwtService,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _unitOfWork = unitOfWork;
    }

    public async Task<LoginResponseDto> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        // Find user by Email
        User? user = await _userRepository.GetByEmailAsync(request.Email);

        if (user is null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Your NovaERP account has been deactivated. Please contact your administrator.");

        // Verify Password
        bool validPassword =
            _passwordHasher.VerifyPassword(
                request.Password,
                user.PasswordHash);

        if (!validPassword)
            throw new UnauthorizedAccessException("Invalid email or password.");

        // Load RolePermissions and construct final permissions list
        var permissions = new List<string>();
        var roleIds = user.UserRoles?.Select(ur => ur.RoleId).ToList();

        if (roleIds != null && roleIds.Any())
        {
            var allRoles = await _unitOfWork.Roles.GetAllAsync(1, int.MaxValue);
            var activeRoleIds = allRoles.Items
                .Where(r => roleIds.Contains(r.Id) && r.IsActive)
                .Select(r => r.Id)
                .ToList();

            if (!activeRoleIds.Any())
                throw new UnauthorizedAccessException("Your assigned role(s) are currently inactive. Please contact your administrator.");

            var rolePermissions = await _unitOfWork.RolePermissions.GetAllAsync(1, int.MaxValue);
            var permissionIds = rolePermissions.Items
                .Where(rp => activeRoleIds.Contains(rp.RoleId))
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

        // Generate JWT Token
        return _jwtService.GenerateToken(user, permissions);
    }
}