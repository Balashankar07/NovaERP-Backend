import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";
import { AlertCircle, ArrowUpRight, Clock, Receipt, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/routes";

export function ProcurementOverview() {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "procurement-summary"],
    queryFn: dashboardApi.getProcurementSummary,
  });

  const data = response;

  return (
    <Card className="flex flex-col h-full shadow-sm border-border bg-card text-card-foreground">
      <CardHeader className="pb-3 border-b border-border bg-muted/40 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Procurement Pipeline</CardTitle>
        <Link to={ROUTES.PROCUREMENT} className="text-xs font-medium text-primary hover:underline flex items-center">
          Purchasing <ArrowUpRight className="h-3 w-3 ml-0.5" />
        </Link>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-6 text-sm text-slate-500 dark:text-slate-400">Loading procurement data...</div>
        ) : isError || !data ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-sm text-rose-500 dark:text-rose-400">
            <AlertCircle className="h-8 w-8 mb-2 opacity-80" />
            Failed to load procurement overview
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-y divide-border flex-1">
            <div className="p-5 flex flex-col justify-center border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.pendingPurchaseRequests}</span>
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Pending Requests</p>
            </div>
            
            <div className="p-5 flex flex-col justify-center border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.openPurchaseOrders}</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Open Orders (POs)</p>
            </div>

            <div className="p-5 flex flex-col justify-center hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.pendingReceipts}</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Pending Receipts</p>
            </div>

            <div className="p-5 flex flex-col justify-center hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-3xl font-bold ${data.overdueReceipts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {data.overdueReceipts}
                </span>
                <div className={`p-2 rounded-lg ${data.overdueReceipts > 0 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Overdue Receipts</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

