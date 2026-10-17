import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { NotificationType } from '@/types/notifications.types';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const NotificationPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: preferences = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getPreferences(),
  });

  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (preferences.length > 0) {
      const initial: Record<string, boolean> = {};
      preferences.forEach((p) => {
        initial[p.notificationType] = p.isEnabled;
      });
      setToggles(initial);
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: (payload: { notificationType: NotificationType; isEnabled: boolean }[]) =>
      notificationsApi.updatePreferences(payload),
    onSuccess: () => {
      toast.success('Notification preferences updated');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update preferences');
    },
  });

  const handleToggle = (type: string, enabled: boolean) => {
    setToggles((prev) => ({ ...prev, [type]: enabled }));
  };

  const handleSave = () => {
    const payload = Object.entries(toggles).map(([type, isEnabled]) => ({
      notificationType: type as NotificationType,
      isEnabled,
    }));
    saveMutation.mutate(payload);
  };

  if (isLoading) return <LoadingView title="Loading Notification Preferences..." />;
  if (isError) return <ErrorView title="Failed to load notification preferences" onRetry={refetch} />;

  const getLabelDescription = (type: string) => {
    switch (type) {
      case 'ApprovalRequired': return { label: 'Approval Required Alerts', desc: 'Notifications when purchase orders, sales orders, or leave requests require your approval.' };
      case 'LowStock': return { label: 'Low Stock Alerts', desc: 'Deterministic notifications when product stock falls below reorder thresholds.' };
      case 'QualityAlert': return { label: 'Quality & NCR/CAPA Alerts', desc: 'Alerts for non-conformance reports, CAPA assignments, and quality inspections.' };
      case 'WarrantyAlert': return { label: 'Warranty Claim Notifications', desc: 'Alerts when new customer warranty claims are logged or assigned.' };
      case 'ReturnAlert': return { label: 'Reverse Logistics & RMA Alerts', desc: 'Notifications for customer return requests and return inspections.' };
      case 'ProductionAlert': return { label: 'Production Work Notifications', desc: 'Alerts when production executions are started, completed, or assigned.' };
      case 'ProcurementAlert': return { label: 'Procurement Activity Alerts', desc: 'Notifications regarding purchase requests, orders, and goods receipts.' };
      case 'ShipmentAlert': return { label: 'Shipment & Transport Alerts', desc: 'Alerts regarding dispatch updates, tracking status, and delivery challans.' };
      case 'FinanceAlert': return { label: 'Finance & Accounting Alerts', desc: 'Notifications for customer invoices, supplier invoices, and payment approvals.' };
      case 'HRAlert': return { label: 'HR & Leave Approvals', desc: 'Notifications for employee leave requests, attendance, and workforce updates.' };
      case 'LogisticsAlert': return { label: 'Logistics Document Alerts', desc: 'Notifications for packing lists and delivery challans.' };
      default: return { label: type, desc: `Receive alerts for ${type}` };
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Notification Center
        </Button>
      </div>

      <PageHeader
        title="Notification Preferences"
        description="Configure which business workflow notification types you wish to receive in your account."
        actions={
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
            <Save className="h-4 w-4" /> Save Preferences
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" /> Workflow & Alert Categories
          </CardTitle>
          <CardDescription>
            Enabling or disabling categories affects only your user account. Critical security and account alerts remain active.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {preferences.map((pref) => {
            const { label, desc } = getLabelDescription(pref.notificationType);
            const isEnabled = toggles[pref.notificationType] ?? pref.isEnabled;

            return (
              <div key={pref.notificationType} className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{isEnabled ? 'Enabled' : 'Disabled'}</span>
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(pref.notificationType, !!checked)}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
