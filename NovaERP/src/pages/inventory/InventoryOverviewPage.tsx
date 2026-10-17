import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { inventoryApi, InventorySummaryDto } from "@/api";
import { ROUTES } from "@/routes";
import { Package, AlertTriangle, XCircle, Warehouse, ArrowRightLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";

export function InventoryOverviewPage() {
  const [summary, setSummary] = useState<InventorySummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryApi.getSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory summary");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView title="Loading Inventory Overview..." />;
  if (error) return <ErrorView message={error} onRetry={fetchSummary} />;
  if (!summary) return null;

  return (
    <PageContainer>
      <PageHeader
        title="Inventory Overview"
        description="Monitor current stock levels, warehouses, and recent movements."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Products in Stock</CardTitle>
            <Package className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.totalProductsInStock}</div>
            <p className="text-xs text-slate-500 mt-1">Across all warehouses</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total On Hand Qty</CardTitle>
            <Warehouse className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.totalOnHandQuantity}</div>
            <p className="text-xs text-slate-500 mt-1">
              Available: <span className="text-emerald-600 font-semibold">{summary.totalAvailableQuantity}</span> | 
              Reserved: <span className="text-amber-600 font-semibold">{summary.totalReservedQuantity}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Low Stock / Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary.lowStockItems} <span className="text-slate-400 font-normal">/</span> <span className="text-rose-600">{summary.outOfStockItems}</span></div>
            <p className="text-xs text-slate-500 mt-1">Items requiring attention</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.warehouseCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active storage locations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Link to={ROUTES.INVENTORY_STOCK} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300 transition-all group">
              <Package className="h-8 w-8 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-800">View Stock Levels</span>
            </Link>
            <Link to={ROUTES.INVENTORY_TRANSACTIONS} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300 transition-all group">
              <ArrowRightLeft className="h-8 w-8 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-800">View Transactions</span>
            </Link>
            <Link to={ROUTES.INVENTORY_WAREHOUSES} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300 transition-all group">
              <Warehouse className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-slate-800">Manage Warehouses</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
