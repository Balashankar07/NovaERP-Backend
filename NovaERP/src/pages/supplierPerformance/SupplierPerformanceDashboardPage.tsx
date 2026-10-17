import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supplierPerformanceApi } from '@/api/supplierPerformance.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Award, 
  Clock, 
  PackageCheck, 
  ShieldCheck, 
  CircleDollarSign, 
  ArrowRight,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/use-permissions';

export const SupplierPerformanceDashboardPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.SupplierPerformance.View");

  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ['supplier-performance-overview'],
    queryFn: () => supplierPerformanceApi.getOverview(),
    enabled: canView,
  });

  if (isLoading) return <LoadingView title="Loading Supplier Performance Dashboard..." />;
  if (isError || !overview) return <ErrorView title="Failed to load supplier performance overview" onRetry={refetch} />;

  const gradeCounts = overview.gradeDistribution || {};

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Supplier Performance & Scorecards Control Center"
        description="Deterministic, real-data vendor performance tracking using PO fulfillment, GRN timeliness, quality rejections, and commercial spend (Domain 7)."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/suppliers/performance/list">
                <Building2 className="h-4 w-4 mr-1.5" /> All Vendor Summaries
              </Link>
            </Button>
            <Button asChild className="gap-1 bg-indigo-600 hover:bg-indigo-700">
              <Link to="/suppliers/performance/reports">
                <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics & Config
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total / Evaluated Vendors</CardTitle>
            <Building2 className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.evaluatedSuppliers} / {overview.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active suppliers with real transaction history</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg On-Time Delivery</CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{overview.averageOnTimeDeliveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Based on actual GRN vs PO expected dates</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Fill Rate</CardTitle>
            <PackageCheck className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{overview.averageFillRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Ratio of received vs ordered product quantities</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Quality Acceptance</CardTitle>
            <ShieldCheck className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{overview.averageQualityAcceptanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Percentage of received goods accepted</p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution & Financial Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Vendor Scorecard Grade Breakdown
            </CardTitle>
            <CardDescription>
              Transparent classification based on weighted delivery, fulfillment, quality, and catalog price performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-xs font-semibold text-emerald-800">Grade A (≥90%)</div>
                <div className="text-xl font-bold text-emerald-700 mt-1">{gradeCounts['Grade A - Excellent'] || 0}</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Excellent</div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-xs font-semibold text-blue-800">Grade B (75-89%)</div>
                <div className="text-xl font-bold text-blue-700 mt-1">{gradeCounts['Grade B - Good'] || 0}</div>
                <div className="text-[10px] text-blue-600 mt-0.5">Good</div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="text-xs font-semibold text-amber-800">Grade C (60-74%)</div>
                <div className="text-xl font-bold text-amber-700 mt-1">{gradeCounts['Grade C - Satisfactory'] || 0}</div>
                <div className="text-[10px] text-amber-600 mt-0.5">Satisfactory</div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="text-xs font-semibold text-rose-800">Grade D (&lt;60%)</div>
                <div className="text-xl font-bold text-rose-700 mt-1">{gradeCounts['Grade D - Needs Attention'] || 0}</div>
                <div className="text-[10px] text-rose-600 mt-0.5">Needs Attention</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs font-semibold text-slate-700">Insufficient Data</div>
                <div className="text-xl font-bold text-slate-700 mt-1">{gradeCounts['INSUFFICIENT DATA'] || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">No PO / GRN</div>
              </div>
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground flex items-center justify-between">
              <span>* Scores do not automatically alter supplier status or block PO creation.</span>
              <Link to="/suppliers/performance/list" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                View All Vendors <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Commercial Spend Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-emerald-600" /> Total Evaluated Spend
            </CardTitle>
            <CardDescription>Procurement volume tracked across POs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                ${overview.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Across {overview.totalPOCount} Purchase Orders and {overview.totalGRNCount} Goods Receipts.
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Total PO Count:</span>
                <span className="font-semibold">{overview.totalPOCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Total Goods Receipts:</span>
                <span className="font-semibold">{overview.totalGRNCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Competitor Price Variance:</span>
                <span className="text-amber-600 font-mono">NOT SUPPORTED BY BACKEND</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
