using MediatR;
using NovaERP.Application.Authentication.DTOs;

namespace NovaERP.Application.Authentication.Commands.GoogleSignIn;

/// <summary>
/// Command to authenticate via Google Sign-In.
/// The Credential field contains the Google ID token (JWT) obtained from
/// the @react-oauth/google GoogleLogin component on the frontend.
/// </summary>
public class GoogleSignInCommand : IRequest<LoginResponseDto>
{
    public string Credential { get; set; } = string.Empty;
}
