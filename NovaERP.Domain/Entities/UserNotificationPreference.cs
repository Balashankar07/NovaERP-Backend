using System;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class UserNotificationPreference : AuditableEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public NotificationType NotificationType { get; set; }
    public bool IsEnabled { get; set; } = true;
}
