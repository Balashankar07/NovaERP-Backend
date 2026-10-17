import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { returnsApi } from '@/api/returns.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, RotateCcw, ShieldCheck, Wrench, PackageCheck, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';

export const ReverseLogisticsReportsPage: React.FC = () => {
  const { data: summaryResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['reverse-logistics-summary'],
    queryFn: () => returnsApi.getSummaryReport(),
  });

  const summary = summaryResponse;

  if (isLoading) return <LoadingView title="Generating reverse logistics reports..." />;
  if (isError) return <ErrorView title="Failed to load reverse logistics summary" onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reverse Logistics Analytics & Reports"
        description="Comprehensive summary metrics for returns, RMAs, quality inspections, dispositions, repairs, and stock replacements"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Summary
          </Button>
        }
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customer Returns</CardTitle>
            <RotateCcw className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalReturns || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-blue-600 font-semibold">{summary?.activeRmas || 0} Active RMAs</span> authorized
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Receipts & Quality</CardTitle>
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.pendingReceipts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-amber-600 font-semibold">{summary?.pendingInspections || 0} pending quality inspections</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Repairs In Progress</CardTitle>
            <Wrench className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.inRepairCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Assigned to active work centers & technicians
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Replacements</CardTitle>
            <PackageCheck className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.completedReplacements || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-emerald-600 font-semibold">
              100% fulfilled & stock issued
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Impact Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" /> Inventory Disposition Impact
            </CardTitle>
            <CardDescription>Physical inventory status of inspected returned items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-md text-emerald-700">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-emerald-900">Restocked Items</div>
                  <div className="text-xs text-emerald-700">Returned to available inventory following quality approval</div>
                </div>
              </div>
              <span className="text-2xl font-bold text-emerald-800">{summary?.restockedCount || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-md text-red-700">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-red-900">Scrapped Items</div>
                  <div className="text-xs text-red-700">Permanently written off inventory via quality inspection</div>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-800">{summary?.scrappedCount || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-md text-purple-700">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-purple-900">Repaired Items</div>
                  <div className="text-xs text-purple-700">Successfully restored & reinspected for stock/replacement</div>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-800">{summary?.repairedCount || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Warranty & Financial Integration Notes
            </CardTitle>
            <CardDescription>Domain 6 integration parameters & non-AI capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm space-y-2">
              <div className="font-semibold text-slate-800">Warranty Integration</div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Returns and RMA workflows link directly with existing Warranty Claims. Return receipt and disposition trigger formal claim resolution without violating warranty status transition rules.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm space-y-2">
              <div className="font-semibold text-amber-900">Financial Credit Notes</div>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                NOT SUPPORTED BY BACKEND
              </Badge>
              <p className="text-amber-800 text-xs leading-relaxed">
                Monetary return/refund accounting is preserved as not supported by backend. No synthetic accounting entries or simulated refunds are generated.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm space-y-2">
              <div className="font-semibold text-blue-900">Serial & Batch Traceability</div>
              <p className="text-blue-800 text-xs leading-relaxed">
                Full end-to-end traceability preserved from Sales Order → Shipment → Customer Return → RMA → Receipt → Inspection → Disposition → Repair/Replacement/Scrap.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
