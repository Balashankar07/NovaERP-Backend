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

    public LoginCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
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

        // Generate JWT Token
        return _jwtService.GenerateToken(user);
    }
}