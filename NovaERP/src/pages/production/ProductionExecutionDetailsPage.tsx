import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Play, CheckCircle2, XCircle, FileText, Send, PackageMinus } from "lucide-react";

import { productionApi } from "@/api/production.api";
import { productionOperationsApi } from "@/api/productionOperations.api";
import { warehousesApi } from "@/api/warehouses.api";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { formatDateTime } from "@/utils/formatters";

const getStatusBadge = (status: string | number) => {
  const s = String(status).toLowerCase();
  if (s === 'draft' || s === '0') return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
  if (s === 'started' || s === '1') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Started</Badge>;
  if (s === 'completed' || s === '2') return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
  if (s === 'cancelled' || s === '3') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

import { usePermissions } from "@/hooks/use-permissions";

export const ProductionExecutionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canStart = hasPermission("Permissions.ProductionExecution.Start");
  const canConsume = hasPermission("Permissions.ProductionExecution.Consume");
  const canComplete = hasPermission("Permissions.ProductionExecution.Complete");
  const canCancel = hasPermission("Permissions.ProductionExecution.Cancel");

  const [activeAction, setActiveAction] = useState<"complete" | "cancel" | null>(null);
  const [completeQty, setCompleteQty] = useState<string>("");
  const [rejectQty, setRejectQty] = useState<string>("0");
  const [cancelReason, setCancelReason] = useState<string>("");
  const [outputWarehouseId, setOutputWarehouseId] = useState<string>("");
  const [outputLocationId, setOutputLocationId] = useState<string>("");

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehousesApi.getAll({ pageSize: 100 }),
  });

  const { data: execData, isLoading, error, refetch } = useQuery({
    queryKey: ["production-execution", id],
    queryFn: () => productionApi.getExecutionById(id!),
    enabled: !!id,
  });

  const execution = execData?.data || execData;

  const { data: orderResponse } = useQuery({
    queryKey: ["production-order", execution?.productionOrderId],
    queryFn: () => productionApi.getOrderById(execution!.productionOrderId),
    enabled: !!execution?.productionOrderId,
  });
  const order = orderResponse?.data || orderResponse;

  const startMutation = useMutation({
    mutationFn: () => productionApi.startExecution(id!),
    onSuccess: () => {
      toast.success("Execution started successfully.");
      queryClient.invalidateQueries({ queryKey: ["production-execution", id] });
      queryClient.invalidateQueries({ queryKey: ["production-executions"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start execution.");
    }
  });

  const consumeMutation = useMutation({
    mutationFn: () => productionApi.consumeMaterials(id!),
    onSuccess: () => {
      toast.success("Materials consumed successfully.");
      queryClient.invalidateQueries({ queryKey: ["production-execution", id] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to consume materials.");
    }
  });

  const completeMutation = useMutation({
    mutationFn: (data: { producedQuantity: number, rejectedQuantity: number, outputWarehouseId: string, outputWarehouseLocationId?: string }) => productionApi.completeExecution(id!, data),
    onSuccess: () => {
      toast.success("Execution completed successfully.");
      setActiveAction(null);
      queryClient.invalidateQueries({ queryKey: ["production-execution", id] });
      queryClient.invalidateQueries({ queryKey: ["production-executions"] });
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["quality-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to complete execution.");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => productionApi.cancelExecution(id!, { reason }),
    onSuccess: () => {
      toast.success("Execution cancelled.");
      setActiveAction(null);
      queryClient.invalidateQueries({ queryKey: ["production-execution", id] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel execution.");
    }
  });

  if (isLoading) return <LoadingView title="Loading execution details..." className="h-[60vh]" />;
  if (error || !execution) return <ErrorView title="Error" description="Failed to load execution details." onRetry={() => refetch()} />;

  const statusStr = String(execution.status).toLowerCase();
  const isDraft = statusStr === '0' || statusStr === 'draft';
  const isStarted = statusStr === '1' || statusStr === 'started';
  const isCompleted = statusStr === '2' || statusStr === 'completed';
  const isCancelled = statusStr === '3' || statusStr === 'cancelled';

  const materials = order?.materials || [];
  const hasMaterials = materials.length > 0;
  const materialsConsumed = hasMaterials
    ? materials.every((m: any) => (m.consumedQuantity || 0) >= (m.requiredQuantity || 0))
    : true;

  return (
    <PageContainer className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.PRODUCTION_EXECUTIONS)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                {execution.executionNumber || 'Production Execution'}
                {getStatusBadge(execution.status)}
              </div>
            }
            description={`Created on ${new Date(execution.createdAt).toLocaleDateString()}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to={ROUTES.PRODUCTION_ORDER_DETAIL(execution.productionOrderId)}>
            <Button variant="outline" className="shadow-sm">
              <FileText className="w-4 h-4 mr-2" />
              View Production Order
            </Button>
          </Link>

          {isDraft && canStart && (
            <Button 
              onClick={() => startMutation.mutate()} 
              disabled={startMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {startMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Start Execution
            </Button>
          )}

          {isStarted && (
            <>
              {canConsume && (
                <Button 
                  onClick={() => consumeMutation.mutate()} 
                  disabled={consumeMutation.isPending || materialsConsumed}
                  className={materialsConsumed ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-amber-600 hover:bg-amber-700 text-white"}
                >
                  {consumeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PackageMinus className="w-4 h-4 mr-2" />}
                  {materialsConsumed ? "Materials Consumed" : "Consume Materials"}
                </Button>
              )}

              {canComplete && (
                <Button 
                  onClick={() => {
                    if (!materialsConsumed) {
                      toast.error("Cannot complete execution: Materials must be consumed first.");
                      return;
                    }
                    setCompleteQty("");
                    setRejectQty("0");
                    setOutputWarehouseId("");
                    setOutputLocationId("");
                    setActiveAction("complete");
                  }}
                  disabled={!materialsConsumed}
                  className={!materialsConsumed ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                  title={!materialsConsumed ? "Materials must be consumed before completing execution" : ""}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Execution
                </Button>
              )}
            </>
          )}

          {(isDraft || isStarted) && canCancel && (
            <Button 
              variant="outline"
              onClick={() => {
                setCancelReason("");
                setActiveAction("cancel");
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Execution
            </Button>
          )}
        </div>
      </div>

      {isStarted && !materialsConsumed && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PackageMinus className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Material Consumption Required</p>
              <p className="text-xs text-amber-700">Click "Consume Materials" to issue required component materials before completing this execution.</p>
            </div>
          </div>
          {canConsume && (
            <Button 
              size="sm" 
              onClick={() => consumeMutation.mutate()}
              disabled={consumeMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 ml-4"
            >
              {consumeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Consume Materials Now
            </Button>
          )}
        </div>
      )}
      {/* Structured Operational Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* A. Production & Workflow Context */}
        <SectionCard className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">A. Production & Workflow Context</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Production Order</p>
              <p className="font-semibold text-slate-900 truncate">
                {order ? (
                  <Link to={ROUTES.PRODUCTION_ORDER_DETAIL(execution.productionOrderId)} className="text-indigo-600 hover:underline">
                    {order.productionOrderNumber || execution.productionOrderId}
                  </Link>
                ) : (
                  execution.productionOrderId
                )}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Product</p>
              <p className="font-semibold text-slate-900 truncate" title={order?.productName || order?.productId}>
                {order?.productName || order?.productId || 'Loading...'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Planned Target</p>
              <p className="font-medium text-slate-900">{order?.plannedQuantity ?? "-"} units</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Production Plan</p>
              <p className="font-medium text-slate-900 truncate">
                {order?.productionPlanId ? (
                  <Link to={ROUTES.PRODUCTION_PLAN_DETAIL(order.productionPlanId)} className="text-indigo-600 hover:underline">
                    View Plan #{order.productionPlanId.substring(0, 8)}
                  </Link>
                ) : (
                  "-"
                )}
              </p>
            </div>
          </CardContent>
        </SectionCard>

        {/* B & C. Execution Status & Output */}
        <SectionCard className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">B & C. Status & Output Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Current Status</p>
              <div>{getStatusBadge(execution.status)}</div>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Good Produced</p>
              <p className="text-xl font-bold text-emerald-600">{execution.producedQuantity}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Scrap / Rejected</p>
              <p className="text-xl font-bold text-rose-600">{execution.rejectedQuantity}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Started At</p>
              <p className="font-medium text-slate-900 text-xs">{execution.startedAt ? formatDateTime(execution.startedAt) : '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Completed At</p>
              <p className="font-medium text-slate-900 text-xs">{execution.completedAt ? formatDateTime(execution.completedAt) : '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Remarks</p>
              <p className="font-medium text-slate-900 text-xs truncate" title={execution.remarks || '-'}>{execution.remarks || '-'}</p>
            </div>
          </CardContent>
        </SectionCard>
      </div>

      {/* E & F. Workforce, Work Center & Machine Operational Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <SectionCard className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">E. Workforce & Assignments</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs mb-1">Production Supervisor</p>
                <p className="font-semibold text-slate-900">{order?.supervisor || "Assigned on shop floor"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Assigned Work Center</p>
                <p className="font-semibold text-slate-900">{order?.workCenter || "Main Assembly Line"}</p>
              </div>
            </div>
          </CardContent>
        </SectionCard>

        <SectionCard className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">G. Quality & Handoff</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs mb-1">Quality Inspection Handoff</p>
                <p className="font-semibold text-slate-900">
                  {isCompleted ? "Transferred to QA queue" : "Awaiting run completion"}
                </p>
              </div>
              <Badge variant="outline" className={isCompleted ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-slate-50 text-slate-600"}>
                {isCompleted ? "Pending Inspection" : "In Production"}
              </Badge>
            </div>
          </CardContent>
        </SectionCard>
      </div>

      {/* D. Material Consumption Table */}
      <div className="mt-6">
        <SectionCard className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">D. Component Material Requirements & Consumption</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {materials.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No component materials required or assigned to this production order.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/30 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-medium">Material Component ID</th>
                      <th className="px-4 py-3 font-medium text-right">Required Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Consumed Qty</th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materials.map((m: any, idx: number) => {
                      const isFullyConsumed = (m.consumedQuantity || 0) >= (m.requiredQuantity || 0);
                      return (
                        <tr key={m.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900 truncate" title={m.productName || m.productId}>{m.productName || m.productId}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">{m.requiredQuantity}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">{m.consumedQuantity || 0}</td>
                          <td className="px-4 py-3 text-center">
                            {isFullyConsumed ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Consumed</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </SectionCard>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={activeAction === "complete"} 
        onClose={() => setActiveAction(null)}
        title="Complete Execution"
        description="Enter the actual quantities produced during this execution. This will finalize the execution and update finished goods inventory."
      >
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Produced Quantity (Good)</label>
            <Input 
              type="number" 
              min="0"
              value={completeQty}
              onChange={(e) => setCompleteQty(e.target.value)}
              placeholder="e.g., 50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Rejected Quantity (Scrap)</label>
            <Input 
              type="number" 
              min="0"
              value={rejectQty}
              onChange={(e) => setRejectQty(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Output Warehouse <span className="text-red-500">*</span></label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
              value={outputWarehouseId}
              onChange={(e) => setOutputWarehouseId(e.target.value)}
            >
              <option value="" disabled>Select a warehouse...</option>
              {warehousesData?.items?.filter(w => w.isActive).map(w => (
                <option key={w.id} value={w.id}>{w.warehouseName}</option>
              ))}
            </select>
          </div>

          {outputWarehouseId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Output Location (Optional)</label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                value={outputLocationId}
                onChange={(e) => setOutputLocationId(e.target.value)}
              >
                <option value="">No specific location</option>
                {warehousesData?.items?.find(w => w.id === outputWarehouseId)?.locations?.filter(l => l.isActive).map(l => (
                  <option key={l.id} value={l.id}>{l.locationName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setActiveAction(null)}>Cancel</Button>
            <Button 
              onClick={() => completeMutation.mutate({ 
                producedQuantity: Number(completeQty) || 0,
                rejectedQuantity: Number(rejectQty) || 0,
                outputWarehouseId,
                outputWarehouseLocationId: outputLocationId || undefined
              })}
              disabled={completeMutation.isPending || !completeQty || !outputWarehouseId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {completeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Execution
            </Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={activeAction === "cancel"} 
        onClose={() => setActiveAction(null)}
        title="Cancel Execution"
        description="Are you sure you want to cancel this execution? Please provide a reason."
      >
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Reason for Cancellation <span className="text-red-500">*</span></label>
            <Textarea 
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason..."
              className="h-24"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setActiveAction(null)}>Close</Button>
            <Button 
              variant="destructive"
              onClick={() => cancelMutation.mutate(cancelReason)}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
            >
              {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

    </PageContainer>
  );
};
