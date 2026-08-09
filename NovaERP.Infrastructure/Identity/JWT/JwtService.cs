using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using NovaERP.Application.Authentication.DTOs;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;

namespace NovaERP.Infrastructure.Identity.JWT;

public class JwtService : IJwtService
{
    private readonly JwtSettings _jwtSettings;

    public JwtService(IOptions<JwtSettings> jwtOptions)
    {
        _jwtSettings = jwtOptions.Value;
    }

    public LoginResponseDto GenerateToken(User user)
    {
        Console.WriteLine("================================");
        Console.WriteLine("JWT GENERATION SETTINGS");
        Console.WriteLine($"Issuer   : {_jwtSettings.Issuer}");
        Console.WriteLine($"Audience : {_jwtSettings.Audience}");
        Console.WriteLine($"Secret   : {_jwtSettings.SecretKey}");
        Console.WriteLine($"Expiry   : {_jwtSettings.ExpiryMinutes}");
        Console.WriteLine("================================");

        var claims = new List<Claim>
        {
            // User Claims
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new(ClaimTypes.Email, user.Email),
            // JWT Standard Claims
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var roleNames = new List<string>();
        if (user.UserRoles != null)
        {
            foreach (var ur in user.UserRoles)
            {
                if (ur.Role != null)
                {
                    claims.Add(new Claim(ClaimTypes.Role, ur.Role.Name));
                    roleNames.Add(ur.Role.Name);
                }
            }
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires,
            signingCredentials: credentials);

        return new LoginResponseDto
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expires,
            UserName = $"{user.FirstName} {user.LastName}",
            Role = string.Join(", ", roleNames)
        };
    }
}