import { useQuery } from "@tanstack/react-query";
import { supplierPerformanceApi } from "@/api/supplierPerformance.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { ShieldCheck, ArrowUpRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";

export function SupplierPerformanceSummaryWidget() {
  const navigate = useNavigate();

  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ["supplier-performance-overview"],
    queryFn: () => supplierPerformanceApi.getOverview(),
    staleTime: 30000,
  });

  if (isError) {
    return (
      <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl h-full">
        <ErrorView message="Failed to load Supplier Performance overview." onRetry={() => refetch()} />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl h-full flex flex-col min-h-[160px]">
        <LoadingView title="Loading supplier metrics..." />
      </Card>
    );
  }

  const hasData = overview && overview.evaluatedSuppliers > 0;

  return (
    <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl flex flex-col h-full min-h-[160px]">
      <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between border-b border-slate-100">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Supplier Performance Summary
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">Key quality and delivery metrics across all suppliers</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 font-medium" onClick={() => navigate('/suppliers/performance')}>
          View Details <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-4 flex-1 flex flex-col justify-center">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-4">
            <ShieldCheck className="w-6 h-6 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-900">Insufficient Data</p>
            <p className="text-xs text-center mt-1">Suppliers lack sufficient PO/GRN history for performance evaluation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Evaluated</span>
              <span className="text-2xl font-bold text-slate-900 mt-1">{overview.evaluatedSuppliers}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">of {overview.activeSuppliers} active</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">On-Time Delivery</span>
              <span className="text-2xl font-bold text-emerald-900 mt-1">{Math.round(overview.averageOnTimeDeliveryRate || 0)}%</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">Avg Fill Rate</span>
              <span className="text-2xl font-bold text-indigo-900 mt-1">{Math.round(overview.averageFillRate || 0)}%</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">Quality Acceptance</span>
              <span className="text-2xl font-bold text-blue-900 mt-1">{Math.round(overview.averageQualityAcceptanceRate || 0)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
