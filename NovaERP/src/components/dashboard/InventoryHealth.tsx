import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";
import { AlertTriangle, Boxes, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/routes";

export function InventoryHealth() {
  const { data: summaryRes, isLoading: isSummaryLoading, isError: isSummaryError } = useQuery({
    queryKey: ["dashboard", "inventory-summary"],
    queryFn: dashboardApi.getInventorySummary,
  });

  const { data: lowStockRes, isLoading: isLowStockLoading } = useQuery({
    queryKey: ["dashboard", "inventory-report", "low-stock"],
    queryFn: () => dashboardApi.getInventoryReport({ pageSize: 5, sortBy: "quantityOnHand" }),
  });

  const summary = summaryRes;
  const lowStockItems = lowStockRes?.items || [];

  return (
    <Card className="flex flex-col h-full shadow-sm border-border bg-card text-card-foreground">
      <CardHeader className="pb-3 border-b border-border bg-muted/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Inventory Health</CardTitle>
          <Link to={ROUTES.INVENTORY} className="text-xs font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {isSummaryLoading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">Loading inventory health...</div>
        ) : isSummaryError || !summary ? (
          <div className="p-6 text-sm text-rose-500 dark:text-rose-400 text-center flex flex-col items-center">
            <AlertTriangle className="h-8 w-8 mb-2 opacity-80" />
            Failed to load inventory summary
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 p-5 bg-muted/20">
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">{summary.outOfStockItems}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mt-1 tracking-wide">Out of Stock</span>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-amber-500 dark:text-amber-400">{summary.lowStockItems}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mt-1 tracking-wide">Low Stock</span>
              </div>
            </div>

            <div className="px-5 pb-5 flex-1 flex flex-col">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-1.5 pt-3">
                <TrendingDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                Critical & Low Stock Items
              </h4>
              
              {isLowStockLoading ? (
                <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Loading items...</div>
              ) : lowStockItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-slate-400 dark:text-slate-500">
                  <Boxes className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-sm">No items in critical status</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <div key={item.productId} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[180px]">
                          {item.productName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.productCode}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{item.quantityOnHand}</span>
                        {item.quantityOnHand === 0 ? (
                          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">Critical</span>
                        ) : item.quantityOnHand < item.minStockLevel ? (
                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">Low</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">Normal</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

