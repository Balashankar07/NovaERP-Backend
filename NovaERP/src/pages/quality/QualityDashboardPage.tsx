import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { qualityApi } from "@/api/quality.api";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { ROUTES } from "@/routes";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Boxes,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Activity,
  Layers,
  ChevronRight,
  PackageCheck
} from "lucide-react";

export function QualityDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const { data: summary, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["quality", "summary"],
    queryFn: () => qualityApi.getSummary(),
    staleTime: 30000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["quality"] });
    queryClient.invalidateQueries({ queryKey: ["quality-inspections"] });
    queryClient.invalidateQueries({ queryKey: ["production"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "passed":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold text-xs">Passed</Badge>;
      case "partiallypassed":
      case "partially passed":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 font-semibold text-xs">Partial Pass</Badge>;
      case "failed":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100 font-semibold text-xs">Failed</Badge>;
      case "inprogress":
      case "in progress":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 font-semibold text-xs">In Progress</Badge>;
      case "draft":
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100 font-semibold text-xs">Draft</Badge>;
      case "cancelled":
      default:
        return <Badge variant="outline" className="text-xs font-medium">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingView title="Loading Quality Control Center..." message="Aggregating inspection queue, defect analysis, and FG release logs..." />
      </PageContainer>
    );
  }

  if (isError || !summary) {
    return (
      <PageContainer>
        <PageHeader title="Quality Control Center" description="Operational Quality Assurance workspace" />
        <ErrorView
          title="Failed to Load Quality Control Center"
          message="Unable to retrieve backend quality metrics. Please check network or backend server connection."
          onRetry={handleRefresh}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* HEADER & QUICK ACTIONS */}
      <PageHeader
        title="Quality Engineer Control Center"
        description="Operational Quality Control Center: evaluate shop floor production runs, record defects, enforce Pass/Partial Pass/Fail gates, and control Finished Goods release."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching} className="h-9">
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>

          {hasPermission("Permissions.QualityInspection.View") && (
            <Button size="sm" variant="outline" className="h-9 border-indigo-200 hover:bg-indigo-50 text-indigo-700" onClick={() => navigate(ROUTES.QUALITY)}>
              <FileCheck className="h-4 w-4 mr-1.5" /> Inspection List
            </Button>
          )}

          {hasPermission("Permissions.QualityInspection.Complete") && (
            <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate(ROUTES.QUALITY)}>
              <ShieldCheck className="h-4 w-4 mr-1.5" /> Evaluate Queue
            </Button>
          )}
        </div>
      </PageHeader>

      {/* MANDATORY PRIMARY KPI GRID (8 METRICS) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* KPI 1: Pending Inspections */}
        <Card 
          className={`border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer ${
            summary.pendingInspectionsCount > 0 ? "bg-amber-50/40 border-amber-200" : "bg-white"
          }`}
          onClick={() => navigate(ROUTES.QUALITY)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Inspections</CardTitle>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{summary.pendingInspectionsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Handoffs awaiting quality decision</p>
          </CardContent>
        </Card>

        {/* KPI 2: Inspections In Progress */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer"
          onClick={() => navigate(ROUTES.QUALITY)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Progress</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.inProgressInspectionsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Actively being evaluated</p>
          </CardContent>
        </Card>

        {/* KPI 3: Passed Inspections */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer"
          onClick={() => navigate(ROUTES.QUALITY)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Passed Inspections</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{summary.passedInspectionsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Approved & released to FG</p>
          </CardContent>
        </Card>

        {/* KPI 4: Partially Passed Inspections */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer"
          onClick={() => navigate(ROUTES.QUALITY)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Partial Passes</CardTitle>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.partiallyPassedInspectionsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Partial batch FG releases</p>
          </CardContent>
        </Card>

        {/* KPI 5: Failed Inspections */}
        <Card 
          className={`border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer ${
            summary.failedInspectionsCount > 0 ? "bg-rose-50/30 border-rose-200" : "bg-white"
          }`}
          onClick={() => navigate(ROUTES.QUALITY)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Failed Inspections</CardTitle>
            <div className={`p-2 rounded-lg ${summary.failedInspectionsCount > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-50 text-slate-500"}`}>
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.failedInspectionsCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {summary.failedInspectionsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Blocked defective batches</p>
          </CardContent>
        </Card>

        {/* KPI 6: Total Defects */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer"
          onClick={() => navigate(ROUTES.QUALITY)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Defects Logged</CardTitle>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.totalDefectsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Defect units recorded across runs</p>
          </CardContent>
        </Card>

        {/* KPI 7: Accepted Quantity */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Accepted Quantity</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <PackageCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {summary.totalAcceptedQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pass Rate: <span className="font-semibold text-emerald-700">{summary.passRatePercentage}%</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 8: Rejected Quantity */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rejected Quantity</CardTitle>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {summary.totalRejectedQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fail Rate: <span className="font-semibold text-rose-600">{summary.failureRatePercentage}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* INSPECTION PIPELINE BREAKDOWN */}
      <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl mb-6">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" /> Inspection Status Pipeline
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">Authoritative status counts based on QualityInspectionStatus enum</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800 p-0 h-auto" onClick={() => navigate(ROUTES.QUALITY)}>
              View All <ArrowRight className="h-3 w-3 ml-1 inline" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div 
              className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-all cursor-pointer text-center"
              onClick={() => navigate(ROUTES.QUALITY)}
            >
              <div className="text-xs font-medium text-slate-500">Draft</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{summary.statusCounts["Draft"] ?? 0}</div>
            </div>
            <div 
              className="p-3 bg-blue-50/70 rounded-lg border border-blue-100 hover:border-blue-300 transition-all cursor-pointer text-center"
              onClick={() => navigate(ROUTES.QUALITY)}
            >
              <div className="text-xs font-medium text-blue-700">In Progress</div>
              <div className="text-xl font-bold text-blue-900 mt-1">{summary.statusCounts["InProgress"] ?? 0}</div>
            </div>
            <div 
              className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer text-center"
              onClick={() => navigate(ROUTES.QUALITY)}
            >
              <div className="text-xs font-medium text-emerald-700">Passed</div>
              <div className="text-xl font-bold text-emerald-900 mt-1">{summary.statusCounts["Passed"] ?? 0}</div>
            </div>
            <div 
              className="p-3 bg-amber-50/70 rounded-lg border border-amber-100 hover:border-amber-300 transition-all cursor-pointer text-center"
              onClick={() => navigate(ROUTES.QUALITY)}
            >
              <div className="text-xs font-medium text-amber-700">Partial Pass</div>
              <div className="text-xl font-bold text-amber-900 mt-1">{summary.statusCounts["PartiallyPassed"] ?? 0}</div>
            </div>
            <div 
              className="p-3 bg-rose-50/70 rounded-lg border border-rose-100 hover:border-rose-300 transition-all cursor-pointer text-center"
              onClick={() => navigate(ROUTES.QUALITY)}
            >
              <div className="text-xs font-medium text-rose-700">Failed</div>
              <div className="text-xl font-bold text-rose-900 mt-1">{summary.statusCounts["Failed"] ?? 0}</div>
            </div>
            <div 
              className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-all cursor-pointer text-center"
              onClick={() => navigate(ROUTES.QUALITY)}
            >
              <div className="text-xs font-medium text-slate-400">Cancelled</div>
              <div className="text-xl font-bold text-slate-600 mt-1">{summary.statusCounts["Cancelled"] ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INSPECTION QUEUE TABLE */}
      <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl mb-6">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600" /> Quality Inspection Queue
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Pending & In-Progress inspections from completed shop floor executions requiring Quality evaluation
              </CardDescription>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              {summary.pendingInspectionsCount} Pending Decision
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!summary.inspectionQueue || summary.inspectionQueue.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              Inspection queue clear! No pending floor handoffs awaiting evaluation.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Inspection #</th>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Execution #</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4 text-right">Qty to Inspect</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.inspectionQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.inspectionNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{item.productionOrderNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{item.executionNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{item.productName}</td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-700">{item.inspectedQuantity}</td>
                      <td className="py-3 px-4 text-slate-500">{item.outputWarehouseName}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 p-2"
                          onClick={() => navigate(`/quality`)}
                        >
                          Evaluate <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DUAL SECTION: FINISHED GOODS RELEASE LOG & DEFECT ANALYSIS */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Finished Goods Release Log */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-emerald-600" /> Finished Goods Release Log
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Recent quality releases posted to Inventory via InventoryMovementService (ProductionReceipt)
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800 p-0 h-auto" onClick={() => navigate(ROUTES.QUALITY)}>
                View Log <ArrowRight className="h-3 w-3 ml-1 inline" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-3 flex-1">
            {!summary.releaseLog || summary.releaseLog.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No finished goods releases recorded yet.</div>
            ) : (
              <div className="space-y-2.5">
                {summary.releaseLog.map((log) => (
                  <div key={log.inspectionId} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{log.inspectionNumber}</span>
                        <span className="text-xs text-slate-400">• Exec: {log.executionNumber}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Product: <span className="font-medium text-slate-800">{log.productName}</span> • Released: <span className="font-semibold text-emerald-700">{log.passedQuantity} units</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Destination: {log.warehouseName}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(log.status)}
                      {log.completedDate && (
                        <div className="text-[10px] text-slate-400 mt-1">{new Date(log.completedDate).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Defect Analysis & Root-Cause Widget */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-purple-600" /> Defect Analysis & Categories
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Top recorded defects grouped by code, severity, and product
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                {summary.totalDefectsCount} Total Defect Units
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3 flex-1">
            {!summary.defectAnalysis || summary.defectAnalysis.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                Zero defects logged across evaluated production batches.
              </div>
            ) : (
              <div className="space-y-2.5">
                {summary.defectAnalysis.map((def, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[10px] uppercase">{def.defectCode}</Badge>
                        <span className="font-semibold text-slate-900 text-sm">{def.defectName}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Product: {def.productName} • Severity: <span className="font-medium text-slate-700">{def.severity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-600">{def.totalQuantity} units</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{def.occurrenceCount} occurrences</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DUAL SECTION: QUALITY ATTENTION & RECENT ACTIVITY */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quality Attention & Alerts */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" /> Quality Attention & Operational Alerts
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Backend identified quality inspection bottlenecks and rejections
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            {!summary.attentionItems || summary.attentionItems.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                All quality evaluation queues are clear.
              </div>
            ) : (
              <div className="space-y-2.5">
                {summary.attentionItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between cursor-pointer"
                    onClick={() => navigate(item.linkUrl || ROUTES.QUALITY)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-md mt-0.5 ${
                        item.severity === "high" ? "bg-rose-100 text-rose-700" :
                        item.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{item.title}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{item.message}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-800 p-1">
                      Action <ArrowRight className="h-3 w-3 ml-1 inline" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quality Activity */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-700" /> Recent Quality Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800 p-0 h-auto" onClick={() => navigate(ROUTES.QUALITY)}>
                View All <ArrowRight className="h-3 w-3 ml-1 inline" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {!summary.recentActivity || summary.recentActivity.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No recent quality activity recorded.</div>
            ) : (
              <div className="space-y-2.5">
                {summary.recentActivity.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{act.inspectionNumber}</div>
                      <div className="text-xs text-slate-500">{act.productName} • {act.action}</div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(act.status)}
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(act.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
