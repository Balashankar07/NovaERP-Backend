using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities;

public class User : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    // Required Foreign Keys
    public Guid CompanyId { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Company Company { get; set; } = null!;

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}