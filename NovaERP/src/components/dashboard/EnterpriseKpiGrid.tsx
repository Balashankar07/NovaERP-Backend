import {
  CircleDollarSign,
  Factory,
  Warehouse,
  ShoppingCart,
  Users,
  Package,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { KpiCard } from "./KpiCard";

function KpiCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-5 shadow-xs border border-border/60 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3.5 w-24 bg-muted rounded"></div>
        <div className="h-9 w-9 bg-muted rounded-xl"></div>
      </div>
      <div className="h-7 w-28 bg-muted rounded mb-2"></div>
      <div className="h-3 w-16 bg-muted rounded"></div>
    </div>
  );
}

export function EnterpriseKpiGrid() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.getSummary,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 flex flex-col items-center justify-center mb-6 shadow-xs">
        <AlertCircle className="h-8 w-8 mb-2 animate-bounce" />
        <p className="font-bold text-sm">Failed to load Dashboard telemetry</p>
        <p className="text-xs text-muted-foreground mt-1">Ensure NovaERP backend API is running</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <KpiCard 
        title="Sales Volume" 
        value={formatCurrency(data.salesThisMonth ?? 0)} 
        icon={CircleDollarSign}
        trend="14.2%"
        trendUp={true}
        subtitle="This Month"
        iconColorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
      />
      <KpiCard 
        title="Inventory Valuation" 
        value={formatCurrency(data.totalInventoryValue ?? 0)} 
        icon={Warehouse}
        trend="2.8%"
        trendUp={true}
        subtitle="Active Warehouses"
        iconColorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
      />
      <KpiCard 
        title="Production Output" 
        value={formatNumber(data.completedProductionOrders ?? 0)} 
        icon={Factory}
        trend="8.5%"
        trendUp={true}
        subtitle="Orders Completed"
        iconColorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      />
      <KpiCard 
        title="Open Purchase Orders" 
        value={formatNumber(data.openPurchaseOrders ?? 0)} 
        icon={ShoppingCart}
        subtitle="Procurement Queue"
        iconColorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
      />
      <KpiCard 
        title="Active Catalog SKUs" 
        value={formatNumber(data.totalProducts ?? 0)} 
        icon={Package}
        subtitle="Registered Items"
        iconColorClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
      />
      <KpiCard 
        title="Approved Suppliers" 
        value={formatNumber(data.totalSuppliers ?? 0)} 
        icon={Users}
        subtitle="Verified Vendors"
        iconColorClass="bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
      />
    </div>
  );
}
