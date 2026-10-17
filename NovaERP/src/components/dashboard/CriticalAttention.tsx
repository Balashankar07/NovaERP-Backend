import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";
import { AlertCircle, ChevronRight, PackageX, Clock, ShieldAlert } from "lucide-react";
import { ROUTES } from "@/routes/routes";

export function CriticalAttention() {
  const { data: invData, isLoading: invLoading, isError: invError } = useQuery({
    queryKey: ["dashboard", "inventory-summary"],
    queryFn: dashboardApi.getInventorySummary,
  });

  const { data: pData, isLoading: procLoading, isError: procError } = useQuery({
    queryKey: ["dashboard", "procurement-summary"],
    queryFn: dashboardApi.getProcurementSummary,
  });

  const { data: sumData, isLoading: sumLoading, isError: sumError } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.getSummary,
  });

  const exceptions = [];

  if (invData) {
    const outOfStock = invData.outOfStockItems || 0;
    exceptions.push({
      id: "out-of-stock",
      title: `${outOfStock} Items Out of Stock`,
      description: outOfStock > 0 ? "Critical components missing from inventory" : "All items are well stocked",
      icon: PackageX,
      color: outOfStock > 0 ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-900/30" : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900/30",
      link: ROUTES.INVENTORY,
    });
  }

  if (pData) {
    const overdue = pData.overdueReceipts || 0;
    exceptions.push({
      id: "overdue-receipts",
      title: `${overdue} Overdue Purchase Receipts`,
      description: overdue > 0 ? "Suppliers have missed delivery dates" : "All deliveries are on time",
      icon: Clock,
      color: overdue > 0 ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-900/30" : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900/30",
      link: ROUTES.PROCUREMENT,
    });
  }

  if (sumData) {
    const claims = sumData.openWarrantyClaims || 0;
    exceptions.push({
      id: "warranty-claims",
      title: `${claims} Open Warranty Claims`,
      description: claims > 0 ? "Customer warranty claims pending review" : "No pending warranty issues",
      icon: ShieldAlert,
      color: claims > 0 ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-900/30" : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900/30",
      link: ROUTES.WARRANTY,
    });
  }

  const isLoading = invLoading || procLoading || sumLoading;
  const isError = invError && procError && sumError;

  return (
    <Card className="flex flex-col h-full shadow-sm border-border bg-card text-card-foreground">
      <CardHeader className="pb-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Critical Attention Required</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-6 text-sm text-slate-500 dark:text-slate-400">Loading exceptions...</div>
        ) : isError ? (
          <div className="flex-1 flex items-center justify-center p-6 text-sm text-rose-500 dark:text-rose-400">Failed to load critical exceptions.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {exceptions.map((exc) => (
              <Link 
                key={exc.id} 
                to={exc.link}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg border ${exc.color}`}>
                    <exc.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {exc.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">{exc.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

