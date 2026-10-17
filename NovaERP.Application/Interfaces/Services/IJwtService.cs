using NovaERP.Application.Authentication.DTOs;
using NovaERP.Domain.Entities;

namespace NovaERP.Application.Interfaces.Services;

public interface IJwtService
{
    LoginResponseDto GenerateToken(User user, List<string> permissions);
}