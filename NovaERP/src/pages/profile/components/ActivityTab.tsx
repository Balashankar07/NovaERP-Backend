import { Activity, FileText, Plus, Edit2, Trash2, AlertCircle, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { userApi } from "@/api/user.api";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

export function ActivityTab() {
  const { user } = useAuth();
  
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user?.userId) return;
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await userApi.getActivity(user.userId);
        setActivities(response);
      } catch (error) {
        console.error("Failed to fetch activity logs", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.userId) {
      fetchActivities();
    }
  }, [user?.userId]);

  const getActivityIconAndColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("add")) {
      return { icon: Plus, color: "text-emerald-500", bg: "bg-emerald-50" };
    }
    if (act.includes("update") || act.includes("edit")) {
      return { icon: Edit2, color: "text-blue-500", bg: "bg-blue-50" };
    }
    if (act.includes("delete") || act.includes("remove")) {
      return { icon: Trash2, color: "text-rose-500", bg: "bg-rose-50" };
    }
    return { icon: FileText, color: "text-slate-500", bg: "bg-slate-50" };
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 md:p-8">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        <p className="text-sm text-slate-500 mt-1">Your recent actions and security events.</p>
      </div>

      <div className="relative pl-3 flex-1 flex flex-col justify-center min-h-[300px]">
        {isLoading && (
          <div className="w-full h-full bg-slate-50 animate-pulse rounded-lg border border-slate-100 flex items-center justify-center min-h-[200px]">
             <div className="h-8 w-8 text-slate-300 animate-spin border-4 border-slate-300 border-t-slate-400 rounded-full" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center text-rose-500 py-10">
            <AlertCircle className="h-10 w-10 mb-2 opacity-80" />
            <p className="font-medium text-sm">Failed to load Recent Activity</p>
          </div>
        )}

        {!isLoading && !isError && activities.length === 0 && (
          <EmptyState
            title="No Activity Data"
            description="You have no recent activity history."
            icon={<Activity className="w-6 h-6 text-slate-400" />}
          />
        )}

        {!isLoading && !isError && activities.length > 0 && (
          <>
            {/* Vertical line connecting timeline */}
            <div className="absolute top-2 bottom-2 left-[27px] w-[2px] bg-slate-100"></div>
            
            <div className="space-y-6 relative z-0">
              {activities.map((activity: any) => {
                const { icon: Icon, color, bg } = getActivityIconAndColor(activity.action);
                
                return (
                  <div key={activity.id} className="relative flex items-start gap-4">
                    <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} border border-white ring-4 ring-white`}>
                      <Icon className={`h-4 w-4 ${color}`} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col flex-1 pb-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-medium text-slate-800">
                          {activity.action} {activity.entityName}
                        </p>
                        <span className="text-[12px] text-slate-400">{formatTime(activity.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {activity.entityName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
