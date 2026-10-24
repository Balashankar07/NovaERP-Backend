import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { NotificationItemComponent } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck, Settings, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/utils/toast';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const prevUnreadCountRef = useRef<number>(0);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canViewNotifications = hasPermission("Permissions.Notifications.View");

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: canViewNotifications && !!user,
    refetchInterval: canViewNotifications ? 5000 : false,
  });

  // Trigger toast popup when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
      toast.info(`You have ${unreadCount - prevUnreadCountRef.current} new notification(s)!`, {
        description: "Check your notification center for details.",
      });
      // Invalidate recent notifications to show the new ones if the popover is open
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, queryClient]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-recent', activeTab],
    queryFn: () => notificationsApi.getUserNotifications(activeTab === 'unread', undefined, 10),
    enabled: isOpen && canViewNotifications && !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-700 dark:text-slate-200">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-rose-600 text-white font-mono text-xs rounded-full border-2 border-background">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96 p-0 shadow-lg border-border" align="end">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-xs text-rose-600 border-rose-300 font-mono">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-muted-foreground hover:text-foreground gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Read All
              </Button>
            )}
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <Link to="/notifications/preferences" onClick={() => setIsOpen(false)}>
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b text-xs">
          <button
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'unread' 
                ? 'border-indigo-600 text-indigo-600 font-semibold' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('unread')}
          >
            Unread
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'all' 
                ? 'border-indigo-600 text-indigo-600 font-semibold' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All Recent
          </button>
        </div>

        {/* List Body */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-2">
          {isLoading ? (
            <div className="py-6 text-center text-xs text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {activeTab === 'unread' ? 'No unread notifications.' : 'No recent notifications.'}
            </div>
          ) : (
            notifications.map((item) => (
              <NotificationItemComponent
                key={item.id}
                notification={item}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                compact
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t text-center bg-muted/20">
          <Button asChild variant="ghost" size="sm" className="w-full text-xs gap-1 text-indigo-600 hover:text-indigo-700">
            <Link to="/notifications" onClick={() => setIsOpen(false)}>
              Open Notification Center <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
