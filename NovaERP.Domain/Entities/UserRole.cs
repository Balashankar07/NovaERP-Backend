using NovaERP.Domain.Common;

namespace NovaERP.Domain.Entities
{
    public class UserRole : AuditableEntity
    {
        public Guid UserId { get; set; }
        public User? User { get; set; }

        public Guid RoleId { get; set; }
        public Role? Role { get; set; }
    }
}
