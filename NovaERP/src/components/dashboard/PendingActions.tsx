import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";
import { CheckCircle2, ChevronRight, FileCheck } from "lucide-react";
import { ROUTES } from "@/routes/routes";

export function PendingActions() {
  const { data: summaryResponse, isLoading: summaryLoading, isError: summaryError } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.getSummary,
  });

  const { data: procResponse, isLoading: procLoading, isError: procError } = useQuery({
    queryKey: ["dashboard", "procurement-summary"],
    queryFn: dashboardApi.getProcurementSummary,
  });

  const pData = procResponse;

  const actions = [];

  if (pData?.awaitingApproval && pData.awaitingApproval > 0) {
    actions.push({
      id: "pr-approvals",
      title: "Purchase Requests Awaiting Approval",
      count: pData.awaitingApproval,
      icon: FileCheck,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-900/30",
      link: ROUTES.PROCUREMENT,
    });
  }

  const isLoading = summaryLoading || procLoading;
  const isError = summaryError && procError; // Only show full error if both fail

  return (
    <Card className="flex flex-col h-full shadow-sm border-border bg-card text-card-foreground">
      <CardHeader className="pb-3 border-b border-border bg-muted/40">
        <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Pending Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-6 text-sm text-slate-500 dark:text-slate-400">Loading pending actions...</div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center p-6 text-sm text-rose-500 dark:text-rose-400">Failed to load pending actions.</div>
        ) : actions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">All caught up!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">No pending workflow actions require your attention.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {actions.map((action) => (
              <Link 
                key={action.id} 
                to={action.link}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${action.color}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {action.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {action.count}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

