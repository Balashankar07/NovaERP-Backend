using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NovaERP.Application.DTOs.Notifications;
using NovaERP.Domain.Enums;

namespace NovaERP.Application.Interfaces.Services;

public interface INotificationService
{
    // Creation & Deduplication
    Task<NotificationDto?> CreateNotificationAsync(CreateNotificationDto dto);

    // User Operations (Strict Recipient Isolation)
    Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, bool? isUnreadOnly = null, NotificationType? type = null, int limit = 50);
    Task<NotificationDto?> GetNotificationByIdAsync(Guid notificationId, Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<NotificationDto?> MarkAsReadAsync(Guid notificationId, Guid userId);
    Task<int> MarkAllAsReadAsync(Guid userId);

    // Preferences
    Task<List<UserNotificationPreferenceDto>> GetUserPreferencesAsync(Guid userId);
    Task UpdateUserPreferencesAsync(Guid userId, List<UpdateNotificationPreferenceDto> preferences);

    // Analytics / Reporting Summary
    Task<NotificationOverviewDto> GetNotificationSummaryAsync(Guid userId);

    // Helper: Notify users by Role Name (e.g. "Procurement Manager", "Sales Manager")
    Task NotifyRoleUsersAsync(string roleName, NotificationType type, string title, string message, NotificationPriority priority, string? entityType, string? entityId, string? actionUrl, string deduplicationPrefix);
}
