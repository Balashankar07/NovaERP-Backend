import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { NotificationType } from '@/types/notifications.types';
import { NotificationItemComponent } from '@/components/notifications/NotificationItem';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Bell, CheckCheck, Settings, Filter, ShieldAlert, Package, Factory, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const NotificationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUnreadOnly, setIsUnreadOnly] = useState<boolean | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['user-notifications', isUnreadOnly, selectedType],
    queryFn: () => notificationsApi.getUserNotifications(
      isUnreadOnly, 
      selectedType !== 'ALL' ? (selectedType as NotificationType) : undefined, 
      100
    ),
  });

  const { data: summary } = useQuery({
    queryKey: ['notifications-summary'],
    queryFn: () => notificationsApi.getSummary(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-summary'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-summary'] });
    },
  });

  const filtered = notifications.filter(item => {
    return (
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.entityType && item.entityType.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (isLoading) return <LoadingView title="Loading Notification Center..." />;
  if (isError) return <ErrorView title="Failed to load notifications" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Notification Center"
        description="Real, persisted workflow notifications, operational alerts, and system assignments for your account (Domain 9)."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || (summary?.unreadCount ?? 0) === 0}
              className="gap-1.5"
            >
              <CheckCheck className="h-4 w-4" /> Mark All as Read
            </Button>
            <Button asChild variant="outline" className="gap-1.5">
              <Link to="/notifications/preferences">
                <Settings className="h-4 w-4" /> Preferences
              </Link>
            </Button>
          </div>
        }
      />

      {/* Overview Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground font-semibold">Total Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalNotifications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground font-semibold text-rose-600">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{summary.unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground font-semibold text-amber-600">High / Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{summary.criticalCount + summary.highCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground font-semibold text-emerald-600">Read</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{summary.readCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <Input
              placeholder="Search notifications by title, message, or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Notification Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="ApprovalRequired">Approval Required</SelectItem>
                <SelectItem value="LowStock">Low Stock</SelectItem>
                <SelectItem value="QualityAlert">Quality Alert</SelectItem>
                <SelectItem value="ProcurementAlert">Procurement Alert</SelectItem>
                <SelectItem value="ProductionAlert">Production Alert</SelectItem>
                <SelectItem value="WarrantyAlert">Warranty Alert</SelectItem>
                <SelectItem value="ReturnAlert">Return Alert</SelectItem>
                <SelectItem value="FinanceAlert">Finance Alert</SelectItem>
                <SelectItem value="HRAlert">HR Alert</SelectItem>
                <SelectItem value="LogisticsAlert">Logistics Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={isUnreadOnly === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setIsUnreadOnly(undefined)}
            >
              All
            </Button>
            <Button
              variant={isUnreadOnly === true ? "default" : "outline"}
              size="sm"
              onClick={() => setIsUnreadOnly(true)}
            >
              Unread Only
            </Button>
            <Button
              variant={isUnreadOnly === false ? "default" : "outline"}
              size="sm"
              onClick={() => setIsUnreadOnly(false)}
            >
              Read Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No notifications found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters or search criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((item) => (
            <NotificationItemComponent
              key={item.id}
              notification={item}
              onMarkRead={(id) => markReadMutation.mutate(id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
