using System;
using System.Collections.Generic;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.DTOs.Notifications;

public class NotificationDto
{
    public Guid Id { get; set; }
    public Guid RecipientUserId { get; set; }
    public string? RecipientUserName { get; set; }

    public NotificationType Type { get; set; }
    public string TypeText => Type.ToString();

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public NotificationPriority Priority { get; set; }
    public string PriorityText => Priority.ToString();

    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? ActionUrl { get; set; }

    public string DeduplicationKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class CreateNotificationDto
{
    public Guid RecipientUserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? ActionUrl { get; set; }

    public string DeduplicationKey { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
}

public class UserNotificationPreferenceDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public NotificationType NotificationType { get; set; }
    public string NotificationTypeText => NotificationType.ToString();
    public bool IsEnabled { get; set; }
}

public class UpdateNotificationPreferenceDto
{
    public NotificationType NotificationType { get; set; }
    public bool IsEnabled { get; set; }
}

public class NotificationOverviewDto
{
    public int TotalNotifications { get; set; }
    public int UnreadCount { get; set; }
    public int ReadCount { get; set; }
    public int CriticalCount { get; set; }
    public int HighCount { get; set; }

    public Dictionary<string, int> CountByType { get; set; } = new();
}
