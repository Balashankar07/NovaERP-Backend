import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { procurementApi, purchaseRequestsApi, ProcurementAttentionItemDto } from "@/api";
import { ProcurementSummaryDto } from "@/api/procurement.api";
import { usePermissions } from "@/hooks/use-permissions";
import { ROUTES } from "@/routes";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { toast } from "sonner";
import { 
  ShoppingCart, FileText, AlertCircle, CheckCircle2, Clock, 
  PackageCheck, RefreshCw, Plus, Users, Truck, AlertTriangle, 
  ShieldAlert, CheckCircle, ChevronRight, DollarSign, Building2,
  ArrowRight, ShieldCheck, ArrowUpRight, Zap
} from "lucide-react";

import { PurchaseRequestFormDialog } from "./components/PurchaseRequestFormDialog";
import { PurchaseOrderFormDialog } from "./components/PurchaseOrderFormDialog";
import { PurchaseRequestDetailsDialog } from "./components/PurchaseRequestDetailsDialog";
import { PurchaseOrderDetailsDialog } from "./components/PurchaseOrderDetailsDialog";
import { ProcurementPipelineCharts } from "./components/ProcurementPipelineCharts";
import { SupplierPerformanceSummaryWidget } from "./components/SupplierPerformanceSummaryWidget";

export function ProcurementDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Dialog states
  const [isPRFormOpen, setIsPRFormOpen] = useState(false);
  const [isPOFormOpen, setIsPOFormOpen] = useState(false);
  const [selectedPRId, setSelectedPRId] = useState<string | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

  // Authoritative Procurement Summary Query (GET /api/Reports/procurement)
  const { 
    data: summary, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isRefetching
  } = useQuery<ProcurementSummaryDto>({
    queryKey: ["procurement", "summary"],
    queryFn: () => procurementApi.getSummary(),
    staleTime: 30000,
  });

  // Approve PR mutation with React Query cache invalidation
  const approvePRMutation = useMutation({
    mutationFn: (id: string) => purchaseRequestsApi.approve(id),
    onSuccess: () => {
      toast.success("Purchase request approved successfully.");
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to approve purchase request.");
    }
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
  };

  const handleAttentionClick = (item: ProcurementAttentionItemDto) => {
    if (item.referenceId) {
      if (item.reference.startsWith("PR-") || item.type.toLowerCase().includes("request")) {
        setSelectedPRId(item.referenceId);
        return;
      }
      if (item.reference.startsWith("PO-") || item.type.toLowerCase().includes("order")) {
        setSelectedPOId(item.referenceId);
        return;
      }
    }
    if (hasPermission("Permissions.PurchaseOrders.Create")) {
      setIsPRFormOpen(true);
    } else {
      navigate(ROUTES.PURCHASE_REQUESTS);
    }
  };

  // High-priority action items aggregated from real pending PRs and attention items
  const highPriorityActions = useMemo(() => {
    if (!summary) return [];
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      badge: string;
      badgeColor: string;
      actionLabel: string;
      onAction: () => void;
    }> = [];

    // Pending PRs requiring approval
    if (summary.recentRequests) {
      const pendingPRs = summary.recentRequests.filter(pr => pr.status === "PendingApproval");
      pendingPRs.forEach(pr => {
        items.push({
          id: pr.referenceId,
          title: `Purchase Request ${pr.requestNumber}`,
          subtitle: `Source: ${pr.source} • Created ${formatDate(pr.createdAt)}`,
          badge: pr.priority || "Pending Approval",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          actionLabel: "Review & Approve",
          onAction: () => setSelectedPRId(pr.referenceId)
        });
      });
    }

    // Overdue GRNs
    if (summary.upcomingReceipts) {
      const overdue = summary.upcomingReceipts.filter(r => r.status === "Overdue");
      overdue.forEach(r => {
        items.push({
          id: r.referenceId,
          title: `Overdue Receipt: PO ${r.poNumber}`,
          subtitle: `Supplier: ${r.supplierName} • Value: ${formatCurrency(r.totalValue)}`,
          badge: "Overdue GRN",
          badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
          actionLabel: "View Order",
          onAction: () => setSelectedPOId(r.referenceId)
        });
      });
    }

    // Material Attention items
    if (summary.needsAttention) {
      summary.needsAttention.slice(0, 3).forEach((att, idx) => {
        items.push({
          id: att.referenceId || `att-${idx}`,
          title: `${att.type}: ${att.reference}`,
          subtitle: att.description,
          badge: att.priority,
          badgeColor: att.priority === "Urgent" ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-amber-100 text-amber-800 border-amber-200",
          actionLabel: att.actionType || "Action",
          onAction: () => handleAttentionClick(att)
        });
      });
    }

    return items;
  }, [summary]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
      case "Closed":
      case "Completed":
      case "Received":
      case "FullyConverted":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-semibold"><CheckCircle2 className="w-3 h-3 mr-1"/> {status}</Badge>;
      case "PendingApproval":
      case "Pending":
      case "Sent":
      case "PartiallyReceived":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase font-semibold"><Clock className="w-3 h-3 mr-1"/> {status}</Badge>;
      case "Overdue":
      case "Rejected":
      case "Cancelled":
      case "Shortage":
      case "Low Stock":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] uppercase font-semibold"><AlertCircle className="w-3 h-3 mr-1"/> {status}</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] uppercase font-semibold">{status}</Badge>;
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] uppercase font-bold shadow-none">Urgent</Badge>;
      case "High":
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border border-orange-200 text-[10px] uppercase font-bold shadow-none">High</Badge>;
      case "Medium":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[10px] uppercase font-bold shadow-none">Medium</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase font-bold shadow-none">{priority || "Normal"}</Badge>;
    }
  };

  if (isError) {
    return (
      <PageContainer>
        <ErrorView message={(error as any)?.message || "Failed to load Procurement Control Center data."} onRetry={handleRefresh} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* PAGE HEADER & OPERATIONAL TOOLBAR */}
      <PageHeader
        title="Procurement Control Center"
        description="Monitor purchase requests, outstanding purchase orders, supplier status, warehouse handoffs, and material availability."
      >
        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefetching} className="h-9 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          {hasPermission("Permissions.PurchaseRequests.View") && (
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PURCHASE_REQUESTS)} className="h-9 text-xs">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Purchase Requests
            </Button>
          )}

          {hasPermission("Permissions.PurchaseOrders.View") && (
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PURCHASE_ORDERS)} className="h-9 text-xs">
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Purchase Orders
            </Button>
          )}

          {hasPermission("Permissions.GoodsReceipts.View") && (
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.GOODS_RECEIPTS)} className="h-9 text-xs">
              <Truck className="h-3.5 w-3.5 mr-1.5" /> Goods Receipts
            </Button>
          )}

          {hasPermission("Permissions.Suppliers.View") && (
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.SUPPLIERS)} className="h-9 text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" /> Suppliers
            </Button>
          )}

          {hasPermission("Permissions.PurchaseOrders.Create") && (
            <Button size="sm" onClick={() => setIsPRFormOpen(true)} className="h-9 text-xs bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New PR
            </Button>
          )}

          {hasPermission("Permissions.PurchaseOrders.Create") && (
            <Button size="sm" className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setIsPOFormOpen(true)}>
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Create PO
            </Button>
          )}
        </div>
      </PageHeader>

      {/* 1. HIGH-PRIORITY ACTION REQUIRED SECTION */}
      {highPriorityActions.length > 0 && (
        <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-none shadow-md mb-6 overflow-hidden">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-300">Action Required</CardTitle>
                <CardDescription className="text-[11px] text-slate-300">Operational procurement items requiring manager review or approval</CardDescription>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono">
              {highPriorityActions.length} Pending Actions
            </Badge>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {highPriorityActions.slice(0, 6).map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-indigo-400/50 rounded-lg p-3 transition-all flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-xs text-white truncate" title={item.title}>{item.title}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-1">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center justify-end pt-1">
                    <Button 
                      size="sm" 
                      onClick={item.onAction}
                      className="h-7 px-2.5 text-[11px] font-medium bg-indigo-500 hover:bg-indigo-600 text-white border-none shadow-none"
                    >
                      {item.actionLabel} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. CORE PROCUREMENT KPI GRID (8 Real Backend Metrics) */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-6">
        {/* KPI 1: Pending PRs */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow transition-all cursor-pointer group"
          onClick={() => navigate(`${ROUTES.PURCHASE_REQUESTS}?status=PendingApproval`)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors truncate">Pending PRs</CardTitle>
            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">{summary?.pendingPurchaseRequests ?? 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">Awaiting review</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 2: Approved PRs */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow transition-all cursor-pointer group"
          onClick={() => navigate(`${ROUTES.PURCHASE_REQUESTS}?status=Approved`)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors truncate">Approved PRs</CardTitle>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">{summary?.approvedPurchaseRequests ?? 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">Ready for PO</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 3: Open POs */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow transition-all cursor-pointer group"
          onClick={() => navigate(`${ROUTES.PURCHASE_ORDERS}?status=Open`)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors truncate">Open POs</CardTitle>
            <ShoppingCart className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">{summary?.openPurchaseOrders ?? 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">Issued to vendor</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 4: Pending Receipts */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow transition-all cursor-pointer group"
          onClick={() => navigate(`${ROUTES.PURCHASE_ORDERS}?status=Sent`)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors truncate">Awaiting GRN</CardTitle>
            <Truck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">{summary?.pendingReceipts ?? 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">Pending warehouse</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 5: Partially Received POs */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow transition-all cursor-pointer group"
          onClick={() => navigate(`${ROUTES.PURCHASE_ORDERS}?status=PartiallyReceived`)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors truncate">Partial Receipts</CardTitle>
            <PackageCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">{summary?.partiallyReceivedOrders ?? 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">In-flight GRN</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 6: Overdue Receipts */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow transition-all cursor-pointer group"
          onClick={() => navigate(`${ROUTES.PURCHASE_ORDERS}?status=Overdue`)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors truncate">Overdue GRN</CardTitle>
            <AlertTriangle className={`h-3.5 w-3.5 ${summary?.overdueReceipts ? 'text-rose-600' : 'text-slate-400'} shrink-0`} />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <div>
                <div className={`text-xl font-bold tracking-tight ${summary?.overdueReceipts ? 'text-rose-600' : 'text-slate-900'}`}>{summary?.overdueReceipts ?? 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">Past expected date</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 7: Active Suppliers & Issues */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow transition-all cursor-pointer group"
          onClick={() => navigate(ROUTES.SUPPLIERS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors truncate">Suppliers</CardTitle>
            <Building2 className="h-3.5 w-3.5 text-slate-600 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <div>
                <div className="text-xl font-bold text-slate-900 tracking-tight">{summary?.activeSuppliersCount ?? 0}</div>
                <p className={`text-[10px] mt-0.5 truncate ${summary?.supplierIssuesCount ? 'text-rose-600 font-medium' : 'text-slate-500'}`}>
                  {summary?.supplierIssuesCount ?? 0} issues flagged
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPI 8: Total Procurement Value */}
        <Card 
          className="bg-white border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow transition-all cursor-pointer group"
          onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide group-hover:text-indigo-600 transition-colors truncate">Total Value</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <div className="h-6 bg-slate-100 animate-pulse rounded mt-1" />
            ) : (
              <div>
                <div className="text-sm font-bold text-slate-900 tracking-tight truncate">{formatCurrency(summary?.totalProcurementValue || 0)}</div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">Committed POs</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. WORKFLOW PIPELINES (Charts) */}
      <ProcurementPipelineCharts summary={summary as ProcurementSummaryDto} />

      {/* 4. SUPPLIER PERFORMANCE SUMMARY */}
      <div className="mb-6">
        <SupplierPerformanceSummaryWidget />
      </div>

      {/* 4. RECEIVING HANDOFF & MATERIAL REQUIREMENT ALERTS */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* WAREHOUSE RECEIVING HANDOFF */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl flex flex-col">
          <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600" /> Warehouse Receiving Handoff
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Orders scheduled for Goods Receipt at Warehouse</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 font-medium" onClick={() => navigate(ROUTES.GOODS_RECEIPTS)}>
              Goods Receipts <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {isLoading ? (
              <LoadingView title="Loading receiving schedule..." />
            ) : !summary?.upcomingReceipts || summary.upcomingReceipts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No open purchase orders currently awaiting receipt.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.upcomingReceipts.map((receipt, idx) => (
                  <div 
                    key={idx}
                    onClick={() => receipt.referenceId && setSelectedPOId(receipt.referenceId)}
                    className="p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">{receipt.poNumber}</span>
                        <span className="text-[11px] text-slate-500">• {receipt.supplierName}</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Outstanding Qty: <span className="font-semibold text-slate-800">{receipt.outstandingQuantity}</span> • Value: <span className="font-medium text-slate-800">{formatCurrency(receipt.totalValue)}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {renderStatusBadge(receipt.status)}
                      <div className={`text-[11px] font-medium ${receipt.status === 'Overdue' ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                        Expected: {formatDate(receipt.expectedDeliveryDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MATERIAL REQUIREMENT ALERTS & SHORTAGES */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl flex flex-col">
          <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Material Requirement Alerts
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Inventory shortages & Production workflow demands</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 font-medium" onClick={() => navigate(ROUTES.INVENTORY_OVERVIEW)}>
              Inventory <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {isLoading ? (
              <LoadingView title="Evaluating material availability..." />
            ) : !summary?.needsAttention || summary.needsAttention.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center h-full">
                <ShieldCheck className="w-6 h-6 text-emerald-500 mb-1" />
                <span>All component stock levels meet current production demand.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.needsAttention.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleAttentionClick(item)}
                    className="p-3 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="pt-0.5">{renderPriorityBadge(item.priority)}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">{item.reference}</span>
                          <span className="text-[11px] text-slate-400">• {item.type}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(item.status)}
                      <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                        {item.actionType} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. RECENT PURCHASING ACTIVITY & VENDOR INSIGHTS */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* RECENT PURCHASE REQUESTS */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Recent Purchase Requests
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Requests submitted across engineering & production</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 font-medium" onClick={() => navigate(ROUTES.PURCHASE_REQUESTS)}>
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <LoadingView title="Loading requests..." />
            ) : !summary?.recentRequests || summary.recentRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No recent purchase requests found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recentRequests.map((pr) => (
                  <div 
                    key={pr.referenceId} 
                    onClick={() => setSelectedPRId(pr.referenceId)}
                    className="p-3 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">{pr.requestNumber}</span>
                        {renderPriorityBadge(pr.priority)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Source: {pr.source} • Created: {formatDate(pr.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(pr.status)}
                      {pr.status === "PendingApproval" && hasPermission("Permissions.PurchaseOrders.Create") && (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-none"
                          disabled={approvePRMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            approvePRMutation.mutate(pr.referenceId);
                          }}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RECENT PURCHASE ORDERS */}
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
          <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between border-b border-slate-100">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" /> Recent Purchase Orders
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Orders issued to suppliers & vendors</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700 font-medium" onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}>
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <LoadingView title="Loading orders..." />
            ) : !summary?.recentOrders || summary.recentOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No recent purchase orders found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recentOrders.map((po) => (
                  <div 
                    key={po.referenceId}
                    onClick={() => setSelectedPOId(po.referenceId)}
                    className="p-3 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">{po.poNumber}</span>
                        <span className="text-xs font-medium text-slate-700">• {po.supplierName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Amount: <span className="font-semibold text-slate-800">{formatCurrency(po.totalAmount)}</span> • Delivery: {formatDate(po.expectedDeliveryDate)}
                      </div>
                    </div>
                    <div>
                      {renderStatusBadge(po.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DIALOG MODALS */}
      <PurchaseRequestFormDialog
        isOpen={isPRFormOpen}
        onClose={() => setIsPRFormOpen(false)}
        onSuccess={() => {
          setIsPRFormOpen(false);
          handleRefresh();
        }}
      />

      <PurchaseOrderFormDialog
        isOpen={isPOFormOpen}
        onClose={() => setIsPOFormOpen(false)}
        onSuccess={() => {
          setIsPOFormOpen(false);
          handleRefresh();
        }}
      />

      {selectedPRId && (
        <PurchaseRequestDetailsDialog
          isOpen={!!selectedPRId}
          onClose={() => setSelectedPRId(null)}
          purchaseRequestId={selectedPRId}
          onStatusChange={handleRefresh}
        />
      )}

      {selectedPOId && (
        <PurchaseOrderDetailsDialog
          isOpen={!!selectedPOId}
          onClose={() => setSelectedPOId(null)}
          purchaseOrderId={selectedPOId}
          onStatusChange={handleRefresh}
        />
      )}
    </PageContainer>
  );
}
