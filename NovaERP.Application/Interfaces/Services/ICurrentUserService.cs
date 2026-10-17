namespace NovaERP.Application.Interfaces.Services;

public interface ICurrentUserService
{
    Guid UserId { get; }

    string Email { get; }

    string Role { get; }

    Guid CompanyId { get; }

    Guid BranchId { get; }

    bool IsAuthenticated { get; }

    IEnumerable<string> Permissions { get; }
}