import { api } from "@/lib/api-helper";
import {
  NotificationItem,
  UserNotificationPreference,
  UpdateNotificationPreference,
  NotificationOverview,
  NotificationType,
} from "@/types/notifications.types";

export const notificationsApi = {
  getUserNotifications: (
    isUnreadOnly?: boolean,
    type?: NotificationType,
    limit: number = 50
  ): Promise<NotificationItem[]> => {
    const params = new URLSearchParams();
    if (isUnreadOnly !== undefined) params.append("isUnreadOnly", isUnreadOnly.toString());
    if (type) params.append("type", type);
    params.append("limit", limit.toString());

    return api.get<NotificationItem[]>(`/Notifications?${params.toString()}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<{ unreadCount: number }>("/Notifications/unread-count");
    return res.unreadCount;
  },

  getNotificationById: (id: string): Promise<NotificationItem> => {
    return api.get<NotificationItem>(`/Notifications/${id}`);
  },

  markAsRead: (id: string): Promise<NotificationItem> => {
    return api.put<NotificationItem>(`/Notifications/${id}/read`);
  },

  markAllAsRead: (): Promise<{ message: string; count: number }> => {
    return api.put<{ message: string; count: number }>("/Notifications/read-all");
  },

  getPreferences: (): Promise<UserNotificationPreference[]> => {
    return api.get<UserNotificationPreference[]>("/Notifications/preferences");
  },

  updatePreferences: async (preferences: UpdateNotificationPreference[]): Promise<void> => {
    await api.put("/Notifications/preferences", preferences);
  },

  getSummary: (): Promise<NotificationOverview> => {
    return api.get<NotificationOverview>("/Notifications/reports/summary");
  },
};
