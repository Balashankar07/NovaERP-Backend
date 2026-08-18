namespace NovaERP.Application.Features.Users.DTOs;

public class UpdateUserDto
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public Guid CompanyId { get; set; }

    public ICollection<Guid> RoleIds { get; set; } = new List<Guid>();
    public bool IsActive { get; set; }

    public string? GoogleSubjectId { get; set; }
}