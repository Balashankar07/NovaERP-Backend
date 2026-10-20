using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NovaERP.Application.DTOs.Notifications;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;

    public NotificationService(AppDbContext context, IAuditLogger auditLogger)
    {
        _context = context;
        _auditLogger = auditLogger;
    }

    public async Task<NotificationDto?> CreateNotificationAsync(CreateNotificationDto dto)
    {
        if (dto.RecipientUserId == Guid.Empty)
            throw new InvalidOperationException("RecipientUserId must be a valid user ID.");

        if (string.IsNullOrWhiteSpace(dto.DeduplicationKey))
            throw new InvalidOperationException("DeduplicationKey is required for notifications.");

        // 1. Check Deduplication
        var existing = await _context.Notifications
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.DeduplicationKey == dto.DeduplicationKey);

        if (existing != null)
        {
            return MapToDto(existing);
        }

        // 2. Check User Preferences
        var preference = await _context.UserNotificationPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == dto.RecipientUserId && p.NotificationType == dto.Type);

        if (preference != null && !preference.IsEnabled)
        {
            // User disabled this notification type
            return null;
        }

        // 3. Create Persisted Notification
        var notification = new Notification
        {
            RecipientUserId = dto.RecipientUserId,
            Type = dto.Type,
            Title = dto.Title,
            Message = dto.Message,
            Priority = dto.Priority,
            IsRead = false,
            ReadAt = null,
            EntityType = dto.EntityType,
            EntityId = dto.EntityId,
            ActionUrl = dto.ActionUrl,
            DeduplicationKey = dto.DeduplicationKey,
            ExpiresAt = dto.ExpiresAt
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return MapToDto(notification);
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(
        Guid userId, 
        bool? isUnreadOnly = null, 
        NotificationType? type = null, 
        int limit = 50)
    {
        var query = _context.Notifications
            .AsNoTracking()
            .Include(n => n.RecipientUser)
            .Where(n => n.RecipientUserId == userId);

        if (isUnreadOnly.HasValue && isUnreadOnly.Value)
        {
            query = query.Where(n => !n.IsRead);
        }

        if (type.HasValue)
        {
            query = query.Where(n => n.Type == type.Value);
        }

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return items.Select(MapToDto).ToList();
    }

    public async Task<NotificationDto?> GetNotificationByIdAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.Notifications
            .AsNoTracking()
            .Include(n => n.RecipientUser)
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientUserId == userId);

        return notification != null ? MapToDto(notification) : null;
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.RecipientUserId == userId && !n.IsRead);
    }

    public async Task<NotificationDto?> MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientUserId == userId);

        if (notification == null)
        {
            return null; // Recipient isolation: returns null if not found or belongs to another user
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return MapToDto(notification);
    }

    public async Task<int> MarkAllAsReadAsync(Guid userId)
    {
        var unreadItems = await _context.Notifications
            .Where(n => n.RecipientUserId == userId && !n.IsRead)
            .ToListAsync();

        if (unreadItems.Count == 0) return 0;

        var now = DateTime.UtcNow;
        foreach (var item in unreadItems)
        {
            item.IsRead = true;
            item.ReadAt = now;
        }

        await _context.SaveChangesAsync();
        return unreadItems.Count;
    }

    public async Task<List<UserNotificationPreferenceDto>> GetUserPreferencesAsync(Guid userId)
    {
        var preferences = await _context.UserNotificationPreferences
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToListAsync();

        var allTypes = Enum.GetValues<NotificationType>();
        var result = new List<UserNotificationPreferenceDto>();

        foreach (var t in allTypes)
        {
            var pref = preferences.FirstOrDefault(p => p.NotificationType == t);
            result.Add(new UserNotificationPreferenceDto
            {
                Id = pref?.Id ?? Guid.Empty,
                UserId = userId,
                NotificationType = t,
                IsEnabled = pref?.IsEnabled ?? true // Default safe: enabled
            });
        }

        return result;
    }

    public async Task UpdateUserPreferencesAsync(Guid userId, List<UpdateNotificationPreferenceDto> preferences)
    {
        var existing = await _context.UserNotificationPreferences
            .Where(p => p.UserId == userId)
            .ToListAsync();

        foreach (var dto in preferences)
        {
            var item = existing.FirstOrDefault(p => p.NotificationType == dto.NotificationType);
            if (item != null)
            {
                item.IsEnabled = dto.IsEnabled;
            }
            else
            {
                _context.UserNotificationPreferences.Add(new UserNotificationPreference
                {
                    UserId = userId,
                    NotificationType = dto.NotificationType,
                    IsEnabled = dto.IsEnabled
                });
            }
        }

        await _context.SaveChangesAsync();
        await _auditLogger.LogAsync("UpdateNotificationPreferences", "UserNotificationPreference", userId.ToString(), "", $"Updated notification preferences for User {userId}");
    }

    public async Task<NotificationOverviewDto> GetNotificationSummaryAsync(Guid userId)
    {
        var userNotifications = await _context.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientUserId == userId)
            .ToListAsync();

        var countByType = userNotifications
            .GroupBy(n => n.Type.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        return new NotificationOverviewDto
        {
            TotalNotifications = userNotifications.Count,
            UnreadCount = userNotifications.Count(n => !n.IsRead),
            ReadCount = userNotifications.Count(n => n.IsRead),
            CriticalCount = userNotifications.Count(n => n.Priority == NotificationPriority.Critical && !n.IsRead),
            HighCount = userNotifications.Count(n => n.Priority == NotificationPriority.High && !n.IsRead),
            CountByType = countByType
        };
    }

    public async Task NotifyRoleUsersAsync(
        string roleName, 
        NotificationType type, 
        string title, 
        string message, 
        NotificationPriority priority, 
        string? entityType, 
        string? entityId, 
        string? actionUrl, 
        string deduplicationPrefix)
    {
        var roleUserIds = await _context.UserRoles
            .AsNoTracking()
            .Include(ur => ur.Role)
            .Where(ur => ur.Role != null && ur.Role.Name == roleName)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync();

        // Also include Super Admins if target role is not Super Admin
        if (roleName != "Super Admin")
        {
            var superAdminIds = await _context.UserRoles
                .AsNoTracking()
                .Include(ur => ur.Role)
                .Where(ur => ur.Role != null && ur.Role.Name == "Super Admin")
                .Select(ur => ur.UserId)
                .Distinct()
                .ToListAsync();

            roleUserIds = roleUserIds.Union(superAdminIds).ToList();
        }

        foreach (var userId in roleUserIds)
        {
            string dedupKey = $"{deduplicationPrefix}:{userId}";
            await CreateNotificationAsync(new CreateNotificationDto
            {
                RecipientUserId = userId,
                Type = type,
                Title = title,
                Message = message,
                Priority = priority,
                EntityType = entityType,
                EntityId = entityId,
                ActionUrl = actionUrl,
                DeduplicationKey = dedupKey
            });
        }
    }

    private static NotificationDto MapToDto(Notification n)
    {
        return new NotificationDto
        {
            Id = n.Id,
            RecipientUserId = n.RecipientUserId,
            RecipientUserName = n.RecipientUser != null ? $"{n.RecipientUser.FirstName} {n.RecipientUser.LastName}".Trim() : null,
            Type = n.Type,
            Title = n.Title,
            Message = n.Message,
            Priority = n.Priority,
            IsRead = n.IsRead,
            ReadAt = n.ReadAt,
            EntityType = n.EntityType,
            EntityId = n.EntityId,
            ActionUrl = n.ActionUrl,
            DeduplicationKey = n.DeduplicationKey,
            CreatedAt = n.CreatedAt,
            ExpiresAt = n.ExpiresAt
        };
    }
}
