export type NotificationType = 
  | 'ApprovalRequired'
  | 'StatusChange'
  | 'LowStock'
  | 'QualityAlert'
  | 'WarrantyAlert'
  | 'ReturnAlert'
  | 'ProductionAlert'
  | 'ProcurementAlert'
  | 'ShipmentAlert'
  | 'FinanceAlert'
  | 'HRAlert'
  | 'LogisticsAlert'
  | 'SystemAlert';

export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Critical';

export interface NotificationItem {
  id: string;
  recipientUserId: string;
  recipientUserName?: string;
  type: NotificationType;
  typeText: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  priorityText: string;
  isRead: boolean;
  readAt?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  deduplicationKey: string;
  createdAt: string;
  expiresAt?: string;
}

export interface UserNotificationPreference {
  id: string;
  userId: string;
  notificationType: NotificationType;
  notificationTypeText: string;
  isEnabled: boolean;
}

export interface UpdateNotificationPreference {
  notificationType: NotificationType;
  isEnabled: boolean;
}

export interface NotificationOverview {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  criticalCount: number;
  highCount: number;
  countByType: Record<string, number>;
}
