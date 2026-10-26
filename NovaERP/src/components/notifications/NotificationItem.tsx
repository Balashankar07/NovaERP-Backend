import React from 'react';
import { NotificationItem as NotificationTypeItem, NotificationType } from '@/types/notifications.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  ShieldAlert, 
  RotateCcw, 
  Factory, 
  ShoppingCart, 
  Truck, 
  Receipt, 
  Users, 
  FileText,
  Clock,
  ExternalLink,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  notification: NotificationTypeItem;
  onMarkRead?: (id: string) => void;
  onNavigate?: () => void;
  compact?: boolean;
}

export const NotificationItemComponent: React.FC<Props> = ({ 
  notification, 
  onMarkRead, 
  onNavigate,
  compact = false 
}) => {
  const navigate = useNavigate();

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'ApprovalRequired': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'LowStock': return <Package className="h-4 w-4 text-rose-600" />;
      case 'QualityAlert': return <ShieldAlert className="h-4 w-4 text-purple-600" />;
      case 'WarrantyAlert': return <ShieldAlert className="h-4 w-4 text-blue-600" />;
      case 'ReturnAlert': return <RotateCcw className="h-4 w-4 text-amber-600" />;
      case 'ProductionAlert': return <Factory className="h-4 w-4 text-indigo-600" />;
      case 'ProcurementAlert': return <ShoppingCart className="h-4 w-4 text-emerald-600" />;
      case 'ShipmentAlert': return <Truck className="h-4 w-4 text-blue-600" />;
      case 'FinanceAlert': return <Receipt className="h-4 w-4 text-emerald-600" />;
      case 'HRAlert': return <Users className="h-4 w-4 text-indigo-600" />;
      case 'LogisticsAlert': return <FileText className="h-4 w-4 text-indigo-600" />;
      default: return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'Critical') return <Badge variant="destructive" className="text-[10px] uppercase font-bold">Critical</Badge>;
    if (priority === 'High') return <Badge className="bg-amber-600 text-white text-[10px] uppercase font-bold">High</Badge>;
    if (priority === 'Low') return <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">Low</Badge>;
    return null;
  };

  const handleClick = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      if (onNavigate) {
        onNavigate();
      }
      // Use setTimeout to allow the dropdown/popover to close before navigating
      setTimeout(() => {
        navigate(notification.actionUrl!);
      }, 0);
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClick();
  };

  return (
    <div 
      className={`p-3 rounded-lg border transition-all ${
        notification.isRead 
          ? 'bg-card border-border/50 opacity-80' 
          : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 cursor-pointer" onClick={handleClick}>
          <div className="mt-0.5 p-1.5 rounded-full bg-background border shadow-xs flex-shrink-0">
            {getTypeIcon(notification.type)}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-start justify-between gap-1.5">
              <span className={`text-sm font-semibold min-w-0 flex-1 truncate ${!notification.isRead ? 'text-indigo-950 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
                {notification.title}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {getPriorityBadge(notification.priority)}
                {!notification.isRead && (
                  <span className="h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3" /> {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {notification.actionUrl && (
                <button
                  type="button"
                  onClick={handleViewClick}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-0.5 hover:underline cursor-pointer bg-transparent border-0 p-0 text-[11px]"
                >
                  View <ExternalLink className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {!notification.isRead && onMarkRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-emerald-600 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
