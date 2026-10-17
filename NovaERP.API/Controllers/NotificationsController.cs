using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NovaERP.API.Authorization;
using NovaERP.Application.DTOs.Notifications;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Enums;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;

    public NotificationsController(
        INotificationService notificationService,
        ICurrentUserService currentUserService)
    {
        _notificationService = notificationService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [HasPermission("Permissions.Notifications.View")]
    public async Task<ActionResult<List<NotificationDto>>> GetUserNotifications(
        [FromQuery] bool? isUnreadOnly,
        [FromQuery] NotificationType? type,
        [FromQuery] int limit = 50)
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "User identity not established." });

        var notifications = await _notificationService.GetUserNotificationsAsync(userId, isUnreadOnly, type, limit);
        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    [HasPermission("Permissions.Notifications.View")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "User identity not established." });

        int count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { unreadCount = count });
    }

    [HttpGet("{id}")]
    [HasPermission("Permissions.Notifications.View")]
    public async Task<ActionResult<NotificationDto>> GetNotificationById(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "User identity not established." });

        var notification = await _notificationService.GetNotificationByIdAsync(id, userId);
        if (notification == null)
        {
            // Recipient Isolation: Return 404 / 403 when trying to access another user's notification
            return NotFound(new { message = $"Notification {id} not found or access denied." });
        }

        return Ok(notification);
    }

    [HttpPut("{id}/read")]
    [HasPermission("Permissions.Notifications.MarkRead")]
    public async Task<ActionResult<NotificationDto>> MarkAsRead(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "User identity not established." });

        var updated = await _notificationService.MarkAsReadAsync(id, userId);
        if (updated == null)
        {
            // Recipient Isolation: Return 404 / 403 when trying to mark another user's notification as read
            return NotFound(new { message = $"Notification {id} not found or access denied." });
        }

        return Ok(updated);
    }

    [HttpPut("read-all")]
    [HasPermission("Permissions.Notifications.MarkRead")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "User identity not established." });

        int count = await _notificationService.MarkAllAsReadAsync(userId);
        return Ok(new { message = $"Marked {count} notifications as read.", count });
    }

    [HttpGet("preferences")]
    [HasPermission("Permissions.Notifications.ManagePreferences")]
    public async Task<ActionResult<List<UserNotificationPreferenceDto>>> GetPreferences()
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "User identity not established." });

        var preferences = await _notificationService.GetUserPreferencesAsync(userId);
        return Ok(preferences);
    }

    [HttpPut("preferences")]
    [HasPermission("Permissions.Notifications.ManagePreferences")]
    public async Task<ActionResult> UpdatePreferences([FromBody] List<UpdateNotificationPreferenceDto> preferences)
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "User identity not established." });

        await _notificationService.UpdateUserPreferencesAsync(userId, preferences);
        return Ok(new { message = "Notification preferences updated successfully." });
    }

    [HttpGet("reports/summary")]
    [HasPermission("Permissions.Notifications.View")]
    public async Task<ActionResult<NotificationOverviewDto>> GetSummary()
    {
        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
            return Unauthorized(new { message = "User identity not established." });

        var summary = await _notificationService.GetNotificationSummaryAsync(userId);
        return Ok(summary);
    }
}
