import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { productionApi } from "@/api/production.api";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { ROUTES } from "@/routes";
import {
  Factory,
  Play,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  RefreshCw,
  Plus,
  ArrowRight,
  Package,
  Boxes,
  Activity,
  FileSpreadsheet,
  AlertCircle,
  BarChart3
} from "lucide-react";

export function ProductionDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const { data: rawSummary, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["production", "summary"],
    queryFn: () => productionApi.getSummary(),
    staleTime: 30000,
  });

  const summary = rawSummary ? {
    totalProductionPlans: rawSummary.totalProductionPlans ?? (rawSummary as any).productionPlansCount ?? 0,
    activeProductionOrders: rawSummary.activeProductionOrders ?? 0,
    pendingExecutions: rawSummary.pendingExecutions ?? 0,
    materialShortagesCount: rawSummary.materialShortagesCount ?? 0,
    ordersInProgress: rawSummary.ordersInProgress ?? 0,
    awaitingQualityCount: rawSummary.awaitingQualityCount ?? 0,
    completedExecutionsCount: rawSummary.completedExecutionsCount ?? (rawSummary as any).completedProductionCount ?? 0,
    totalProducedQuantity: rawSummary.totalProducedQuantity ?? 0,
    totalPlannedQuantity: rawSummary.totalPlannedQuantity ?? 0,
    averageWastePercentage: rawSummary.averageWastePercentage ?? (rawSummary as any).wastePercentage ?? 0,

    planStatusCounts: rawSummary.planStatusCounts ?? (rawSummary as any).planPipeline ?? {},
    orderStatusCounts: rawSummary.orderStatusCounts ?? (rawSummary as any).orderPipeline ?? {},

    materialReadiness: (rawSummary.materialReadiness ?? []).map((mr: any) => ({
      productionOrderId: mr.productionOrderId || mr.referenceId || '',
      productionOrderNumber: mr.productionOrderNumber || mr.orderNumber || '',
      productName: mr.productName || '',
      bomName: mr.description || mr.productName || 'BOM',
      plannedQuantity: mr.plannedQuantity ?? 0,
      requiredComponentQuantity: mr.requiredComponentQuantity ?? 0,
      availableComponentQuantity: mr.availableComponentQuantity ?? 0,
      shortageQuantity: mr.shortageQuantity ?? 0,
      readinessState: mr.readinessState || 'INSUFFICIENT',
    })),

    awaitingQualityInspections: (rawSummary.awaitingQualityInspections ?? []).map((qi: any) => ({
      executionId: qi.executionId || qi.referenceId || '',
      executionNumber: qi.executionNumber || '',
      productionOrderNumber: qi.productionOrderNumber || '',
      productName: qi.productName || '',
      producedQuantity: qi.producedQuantity ?? 0,
      inspectionStatus: qi.inspectionStatus || 'Draft Inspection',
      completedDate: qi.completedDate,
    })),

    attentionItems: (rawSummary.attentionItems ?? (rawSummary as any).needsAttention ?? []).map((item: any) => ({
      id: item.id || item.referenceId || Math.random().toString(),
      title: item.title || item.type || item.reference || 'Production Alert',
      message: item.message || item.description || item.title || '',
      severity: (item.severity || item.priority || 'medium').toLowerCase(),
      linkUrl: item.linkUrl || (item.referenceId ? `/production/orders` : ROUTES.PRODUCTION_ORDERS),
    })),

    recentOrders: (rawSummary.recentOrders ?? []).map((ord: any) => ({
      id: ord.id || ord.referenceId || '',
      orderNumber: ord.orderNumber || '',
      productName: ord.productName || '',
      plannedQuantity: ord.plannedQuantity ?? 0,
      status: ord.status || 'Draft',
      createdAt: ord.createdAt || new Date().toISOString(),
    })),

    recentExecutions: (rawSummary.recentExecutions ?? []).map((ex: any) => ({
      id: ex.id || ex.referenceId || '',
      executionNumber: ex.executionNumber || '',
      orderNumber: ex.orderNumber || '',
      productName: ex.productName || '',
      producedQuantity: ex.producedQuantity ?? 0,
      wastePercentage: ex.wastePercentage ?? 0,
      status: ex.status || 'Draft',
      createdAt: ex.createdAt || new Date().toISOString(),
    })),
  } : null;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["production"] });
    queryClient.invalidateQueries({ queryKey: ["production-plans"] });
    queryClient.invalidateQueries({ queryKey: ["production-orders"] });
    queryClient.invalidateQueries({ queryKey: ["production-executions"] });
    queryClient.invalidateQueries({ queryKey: ["quality-inspections"] });
    refetch();
  };

  const getReadinessBadge = (state: string) => {
    switch (state) {
      case "READY":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold text-xs">READY</Badge>;
      case "PARTIALLY AVAILABLE":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 font-semibold text-xs">PARTIAL</Badge>;
      case "INSUFFICIENT":
      default:
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100 font-semibold text-xs">SHORTAGE</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "passed":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-[11px]">Completed</Badge>;
      case "inprogress":
      case "in progress":
      case "started":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-[11px]">In Progress</Badge>;
      case "released":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-[11px]">Released</Badge>;
      case "draft":
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-medium text-[11px]">Draft</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-medium text-[11px]">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px] font-medium">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingView title="Loading Production Control Center..." message="Aggregating shop floor data, inventory readiness, and quality status..." />
      </PageContainer>
    );
  }

  if (isError || !summary) {
    return (
      <PageContainer>
        <PageHeader title="Production Control Center" description="Operational manufacturing dashboard" />
        <ErrorView
          title="Failed to Load Production Control Center"
          message="Unable to retrieve backend production metrics. Please check network or system state."
          onRetry={handleRefresh}
        />
      </PageContainer>
    );
  }

  // Calculate Yield Percentage safely
  const yieldPct = summary.totalPlannedQuantity > 0
    ? Math.min(100, Math.round((summary.totalProducedQuantity / summary.totalPlannedQuantity) * 1000) / 10)
    : 0;

  return (
    <PageContainer>
      {/* HEADER WITH QUICK ACTIONS */}
      <PageHeader
        title="Production Manager Control Center"
        description="Real-time manufacturing operations workspace: floor schedules, material readiness, quality handoffs, and scrap tracking."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching} className="h-9">
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>

          {hasPermission("Permissions.ProductionPlans.Create") && (
            <Button size="sm" variant="outline" className="h-9 border-indigo-200 hover:bg-indigo-50 text-indigo-700" onClick={() => navigate(ROUTES.PRODUCTION_PLANS)}>
              <Plus className="h-4 w-4 mr-1.5" /> Plan
            </Button>
          )}

          {hasPermission("Permissions.ProductionOrders.Create") && (
            <Button size="sm" className="h-9 bg-slate-900 hover:bg-slate-800 text-white" onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}>
              <Plus className="h-4 w-4 mr-1.5" /> Create Order
            </Button>
          )}

          {hasPermission("Permissions.ProductionExecution.Create") && (
            <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate(ROUTES.PRODUCTION_EXECUTIONS)}>
              <Play className="h-4 w-4 mr-1.5" /> Execute Run
            </Button>
          )}
        </div>
      </PageHeader>

      {/* MANDATORY PRIMARY KPI GRID (8 METRICS) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* KPI 1: Production Plans */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer"
          onClick={() => navigate(ROUTES.PRODUCTION_PLANS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Production Plans</CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.totalProductionPlans}</div>
            <p className="text-xs text-slate-500 mt-1">Master manufacturing plans</p>
          </CardContent>
        </Card>

        {/* KPI 2: Active Production Orders */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer"
          onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Orders</CardTitle>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Factory className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.activeProductionOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Released & in-progress orders</p>
          </CardContent>
        </Card>

        {/* KPI 3: Pending Executions */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer"
          onClick={() => navigate(ROUTES.PRODUCTION_EXECUTIONS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Executions</CardTitle>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.pendingExecutions}</div>
            <p className="text-xs text-slate-500 mt-1">Ready for shop floor run</p>
          </CardContent>
        </Card>

        {/* KPI 4: Material Shortages */}
        <Card 
          className={`border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer ${
            summary.materialShortagesCount > 0 ? "bg-rose-50/40 border-rose-200" : "bg-white"
          }`}
          onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Material Shortages</CardTitle>
            <div className={`p-2 rounded-lg ${summary.materialShortagesCount > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.materialShortagesCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {summary.materialShortagesCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Orders blocked by component stock</p>
          </CardContent>
        </Card>

        {/* KPI 5: Orders In Progress */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer"
          onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Progress</CardTitle>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Cpu className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.ordersInProgress}</div>
            <p className="text-xs text-slate-500 mt-1">Active assembly line runs</p>
          </CardContent>
        </Card>

        {/* KPI 6: Awaiting Quality Inspection */}
        <Card 
          className={`border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer ${
            summary.awaitingQualityCount > 0 ? "bg-amber-50/40 border-amber-200" : "bg-white"
          }`}
          onClick={() => navigate(ROUTES.QUALITY)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Awaiting Quality</CardTitle>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{summary.awaitingQualityCount}</div>
            <p className="text-xs text-slate-500 mt-1">Completed runs pending QA decision</p>
          </CardContent>
        </Card>

        {/* KPI 7: Completed Production */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm rounded-xl hover:border-slate-300 transition-all cursor-pointer"
          onClick={() => navigate(ROUTES.PRODUCTION_EXECUTIONS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed Executions</CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.completedExecutionsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Finished shop floor executions</p>
          </CardContent>
        </Card>

        {/* KPI 8: Total Produced Quantity / Output */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Produced Quantity</CardTitle>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {summary.totalProducedQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Yield: <span className="font-semibold text-slate-700">{yieldPct}%</span> • Waste: <span className="font-semibold text-rose-600">{summary.averageWastePercentage}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PIPELINE SECTION: PLANS & ORDERS */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Production Plan Pipeline */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Production Plan Pipeline</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">Authoritative status breakdown for master planning</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800 p-0 h-auto" onClick={() => navigate(ROUTES.PRODUCTION_PLANS)}>
                View All <ArrowRight className="h-3 w-3 ml-1 inline" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              <div 
                className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-all cursor-pointer text-center"
                onClick={() => navigate(ROUTES.PRODUCTION_PLANS)}
              >
                <div className="text-xs font-medium text-slate-500">Draft</div>
                <div className="text-xl font-bold text-slate-900 mt-1">{summary.planStatusCounts["Draft"] ?? 0}</div>
              </div>
              <div 
                className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 hover:border-blue-300 transition-all cursor-pointer text-center"
                onClick={() => navigate(ROUTES.PRODUCTION_PLANS)}
              >
                <div className="text-xs font-medium text-blue-700">Released</div>
                <div className="text-xl font-bold text-blue-900 mt-1">{summary.planStatusCounts["Released"] ?? 0}</div>
              </div>
              <div 
                className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer text-center"
                onClick={() => navigate(ROUTES.PRODUCTION_PLANS)}
              >
                <div className="text-xs font-medium text-emerald-700">Completed</div>
                <div className="text-xl font-bold text-emerald-900 mt-1">{summary.planStatusCounts["Completed"] ?? 0}</div>
              </div>
              <div 
                className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-all cursor-pointer text-center"
                onClick={() => navigate(ROUTES.PRODUCTION_PLANS)}
              >
                <div className="text-xs font-medium text-slate-400">Cancelled</div>
                <div className="text-xl font-bold text-slate-600 mt-1">{summary.planStatusCounts["Cancelled"] ?? 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Order Pipeline */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Production Order Pipeline</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">Floor order lifecycle counts based on ProductionOrderStatus</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800 p-0 h-auto" onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}>
                View Orders <ArrowRight className="h-3 w-3 ml-1 inline" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              <div 
                className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center cursor-pointer hover:border-slate-300"
                onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}
              >
                <div className="text-[11px] font-medium text-slate-500">Draft</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">{summary.orderStatusCounts["Draft"] ?? 0}</div>
              </div>
              <div 
                className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-100 text-center cursor-pointer hover:border-amber-300"
                onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}
              >
                <div className="text-[11px] font-medium text-amber-700">Released</div>
                <div className="text-lg font-bold text-amber-900 mt-0.5">{summary.orderStatusCounts["Released"] ?? 0}</div>
              </div>
              <div 
                className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-100 text-center cursor-pointer hover:border-blue-300"
                onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}
              >
                <div className="text-[11px] font-medium text-blue-700">In Progress</div>
                <div className="text-lg font-bold text-blue-900 mt-0.5">{summary.orderStatusCounts["InProgress"] ?? 0}</div>
              </div>
              <div 
                className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-100 text-center cursor-pointer hover:border-emerald-300"
                onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}
              >
                <div className="text-[11px] font-medium text-emerald-700">Completed</div>
                <div className="text-lg font-bold text-emerald-900 mt-0.5">{summary.orderStatusCounts["Completed"] ?? 0}</div>
              </div>
              <div 
                className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center cursor-pointer hover:border-slate-300"
                onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}
              >
                <div className="text-[11px] font-medium text-slate-400">Cancelled</div>
                <div className="text-lg font-bold text-slate-600 mt-0.5">{summary.orderStatusCounts["Cancelled"] ?? 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MATERIAL READINESS SECTION (CRITICAL REQUIREMENT) */}
      <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl mb-6">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-indigo-600" /> Material Readiness & Shortages
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Authoritative component inventory check for active production orders using BOM & Available Stock
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              OnHand - Reserved = Available
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!summary.materialReadiness || summary.materialReadiness.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No active orders requiring material readiness evaluation.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">BOM Version</th>
                    <th className="py-3 px-4 text-right">Planned Qty</th>
                    <th className="py-3 px-4 text-right">Req. Components</th>
                    <th className="py-3 px-4 text-right">Avail. Components</th>
                    <th className="py-3 px-4 text-right">Shortage</th>
                    <th className="py-3 px-4 text-center">Readiness</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.materialReadiness.map((mr) => (
                    <tr key={mr.productionOrderId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{mr.productionOrderNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{mr.productName}</td>
                      <td className="py-3 px-4 text-slate-500">{mr.description || mr.productName || 'BOM'}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">{mr.plannedQuantity}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{mr.requiredComponentQuantity}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{mr.availableComponentQuantity}</td>
                      <td className="py-3 px-4 text-right font-semibold text-rose-600">
                        {mr.shortageQuantity > 0 ? mr.shortageQuantity : "-"}
                      </td>
                      <td className="py-3 px-4 text-center">{getReadinessBadge(mr.readinessState)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-800 p-1"
                          onClick={() => navigate(`/production/orders`)}
                        >
                          View Order
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

      {/* DUAL SECTION: AWAITING QUALITY HANDOFF & PRODUCTION ATTENTION */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Awaiting Quality Inspection Handoff Widget */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" /> Awaiting Quality Inspection
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Executions completed on shop floor awaiting Quality decision before Finished Goods inventory release
                </CardDescription>
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {summary.awaitingQualityCount} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            {!summary.awaitingQualityInspections || summary.awaitingQualityInspections.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                No executions currently waiting for Quality Inspection decision.
              </div>
            ) : (
              <div className="space-y-3">
                {summary.awaitingQualityInspections.map((qi, index) => (
                  <div key={qi.inspectionId || `${qi.executionId}-${index}`} className="p-3 rounded-lg border border-slate-200 bg-amber-50/30 hover:bg-amber-50/60 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{qi.executionNumber}</span>
                        <span className="text-xs text-slate-400">• Order: {qi.productionOrderNumber}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Product: <span className="font-medium text-slate-800">{qi.productName}</span> • Produced: <span className="font-semibold text-indigo-700">{qi.producedQuantity} units</span>
                      </div>
                      {qi.completedDate && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Completed: {new Date(qi.completedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[11px] mb-1">
                        {qi.inspectionStatus || "Draft Inspection"}
                      </Badge>
                      <div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100"
                          onClick={() => navigate(ROUTES.QUALITY)}
                        >
                          View QA
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Attention & Operational Alerts */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" /> Production Attention & Operational Alerts
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Backend identified actionable issues requiring Production Manager intervention
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            {!summary.attentionItems || summary.attentionItems.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                All manufacturing lines and material checks operating smoothly.
              </div>
            ) : (
              <div className="space-y-3">
                {summary.attentionItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between cursor-pointer"
                    onClick={() => navigate(item.linkUrl || ROUTES.PRODUCTION_ORDERS)}
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
      </div>

      {/* RECENT PRODUCTION ACTIVITY & EXECUTIONS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Production Orders */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Factory className="h-4 w-4 text-slate-700" /> Recent Production Orders
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800 p-0 h-auto" onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}>
                View All <ArrowRight className="h-3 w-3 ml-1 inline" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {!summary.recentOrders || summary.recentOrders.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No recent production orders found.</div>
            ) : (
              <div className="space-y-2.5">
                {summary.recentOrders.map((ord) => (
                  <div key={ord.id} className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{ord.orderNumber}</div>
                      <div className="text-xs text-slate-500">{ord.productName} • Target: {ord.plannedQuantity} units</div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(ord.status)}
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(ord.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Executions & Waste Metrics */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-600" /> Shop Floor Executions
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800 p-0 h-auto" onClick={() => navigate(ROUTES.PRODUCTION_EXECUTIONS)}>
                View Executions <ArrowRight className="h-3 w-3 ml-1 inline" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {!summary.recentExecutions || summary.recentExecutions.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No recent floor executions found.</div>
            ) : (
              <div className="space-y-2.5">
                {summary.recentExecutions.map((ex) => (
                  <div key={ex.id} className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{ex.executionNumber}</div>
                      <div className="text-xs text-slate-500">
                        {ex.productName} • Produced: <span className="font-medium text-slate-800">{ex.producedQuantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(ex.status)}
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Scrap: <span className="font-semibold text-rose-600">{ex.wastePercentage}%</span>
                      </div>
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
