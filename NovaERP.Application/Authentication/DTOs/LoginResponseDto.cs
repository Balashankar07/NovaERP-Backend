namespace NovaERP.Application.Authentication.DTOs;

public class LoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public List<string> Permissions { get; set; } = new();
}