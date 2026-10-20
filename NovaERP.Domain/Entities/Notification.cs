using System;
using NovaERP.Domain.Common;
using NovaERP.Domain.Enums;

namespace NovaERP.Domain.Entities;

public class Notification : AuditableEntity
{
    public Guid RecipientUserId { get; set; }
    public User? RecipientUser { get; set; }

    public Guid? CompanyId { get; set; }

    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }

    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? ActionUrl { get; set; }

    public string DeduplicationKey { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
}
