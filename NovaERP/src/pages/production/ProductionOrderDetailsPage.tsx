import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Play, CheckCircle2, XCircle, FileText, Send } from "lucide-react";

import { productionApi } from "@/api/production.api";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/utils/formatters";
import { Factory } from "lucide-react";

const getStatusBadge = (status: string | number) => {
  const s = String(status).toLowerCase();
  if (s === 'draft' || s === '0') return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
  if (s === 'released' || s === '1') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Released</Badge>;
  if (s === 'inprogress' || s === '2') return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
  if (s === 'completed' || s === '3') return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
  if (s === 'cancelled' || s === '4') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const getPriorityText = (priority: string | number) => {
  const p = String(priority).toLowerCase();
  if (p === '0' || p === 'low') return "Low";
  if (p === '1' || p === 'medium') return "Medium";
  if (p === '2' || p === 'high') return "High";
  if (p === '3' || p === 'urgent') return "Urgent";
  return priority;
};

import { usePermissions } from "@/hooks/use-permissions";

export const ProductionOrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canRelease = hasPermission("Permissions.ProductionOrders.Release");
  const canStart = hasPermission("Permissions.ProductionOrders.Start");
  const canComplete = hasPermission("Permissions.ProductionOrders.Complete");
  const canCreateExec = hasPermission("Permissions.ProductionExecution.Create");
  const canCancel = hasPermission("Permissions.ProductionOrders.Cancel");

  const [activeAction, setActiveAction] = useState<"start" | "complete" | "cancel" | null>(null);
  
  // Action state forms
  const [startQty, setStartQty] = useState<string>("");
  const [completeQty, setCompleteQty] = useState<string>("");
  const [rejectQty, setRejectQty] = useState<string>("0");
  const [cancelReason, setCancelReason] = useState<string>("");

  const { data: orderData, isLoading, error, refetch } = useQuery({
    queryKey: ["production-order", id],
    queryFn: () => productionApi.getOrderById(id!),
    enabled: !!id,
  });

  const order = orderData?.data || orderData; // handle api-helper unwrap

  const { data: execsData, isLoading: execsLoading } = useQuery({
    queryKey: ["production-executions-by-order", id],
    queryFn: () => productionApi.getAllExecutions({ pageSize: 1000 }),
    enabled: !!id,
  });
  
  const allExecsResponse = execsData?.data || execsData;
  const executions = (allExecsResponse?.items || []).filter((e: any) => e.productionOrderId === id);

  // Mutations
  const releaseMutation = useMutation({
    mutationFn: () => productionApi.releaseOrder(id!),
    onSuccess: () => {
      toast.success("Production order released successfully.");
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to release order.");
    }
  });

  const startMutation = useMutation({
    mutationFn: (qty: number) => productionApi.startOrder(id!, { startedQuantity: qty }),
    onSuccess: () => {
      toast.success("Production order started.");
      setActiveAction(null);
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start order.");
    }
  });

  const completeMutation = useMutation({
    mutationFn: (data: { completedQuantity: number, rejectedQuantity: number }) => productionApi.completeOrder(id!, data),
    onSuccess: () => {
      toast.success("Production order completed.");
      setActiveAction(null);
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to complete order.");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => productionApi.cancelOrder(id!, { reason }),
    onSuccess: () => {
      toast.success("Production order cancelled.");
      setActiveAction(null);
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel order.");
    }
  });

  const createExecutionMutation = useMutation({
    mutationFn: () => productionApi.createExecution({ productionOrderId: id! }),
    onSuccess: (res) => {
      const exec = res.data || (res as any);
      toast.success("Production execution created.");
      queryClient.invalidateQueries({ queryKey: ["production-executions"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      navigate(ROUTES.PRODUCTION_EXECUTION_DETAIL(exec.id));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create execution.");
    }
  });

  if (isLoading) return <LoadingView title="Loading details..." className="h-[60vh]" />;
  if (error || !order) return <ErrorView title="Error" description="Failed to load order details." onRetry={() => refetch()} />;

  const statusStr = String(order.status).toLowerCase();
  const isDraft = statusStr === '0' || statusStr === 'draft';
  const isReleased = statusStr === '1' || statusStr === 'released';
  const isInProgress = statusStr === '2' || statusStr === 'inprogress';
  const isCompleted = statusStr === '3' || statusStr === 'completed';
  const isCancelled = statusStr === '4' || statusStr === 'cancelled';

  return (
    <PageContainer className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        <PageHeader
          title={
            <div className="flex items-center gap-3">
              {order.productionOrderNumber || 'Production Order'}
              {getStatusBadge(order.status)}
            </div>
          }
          description={`Created on ${new Date(order.createdAt).toLocaleDateString()}`}
        />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to={ROUTES.PRODUCTION_PLAN_DETAIL(order.productionPlanId)}>
            <Button variant="outline" className="shadow-sm">
              <FileText className="w-4 h-4 mr-2" />
              View Production Plan
            </Button>
          </Link>

          {isDraft && canRelease && (
            <Button 
              onClick={() => releaseMutation.mutate()} 
              disabled={releaseMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {releaseMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Release Order
            </Button>
          )}

          {isReleased && canStart && (
            <Button 
              onClick={() => {
                setStartQty(String(order.plannedQuantity));
                setActiveAction("start");
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Order
            </Button>
          )}

          {isInProgress && canComplete && (
            <Button 
              onClick={() => {
                setCompleteQty(String(order.startedQuantity));
                setRejectQty("0");
                setActiveAction("complete");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Order
            </Button>
          )}

          {(isReleased || isInProgress) && canCreateExec && (
            <Button
              onClick={() => createExecutionMutation.mutate()}
              disabled={createExecutionMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {createExecutionMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Create Execution
            </Button>
          )}

          {(isDraft || isReleased || isInProgress) && canCancel && (
            <Button 
              variant="outline"
              onClick={() => {
                setCancelReason("");
                setActiveAction("cancel");
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Order Details */}
        <SectionCard className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Product</p>
              <p className="font-medium text-slate-900 truncate" title={order.productName || order.productId}>
                {order.productName || order.productId}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Priority</p>
              <p className="font-medium text-slate-900">{getPriorityText(order.priority)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Planned Start</p>
              <p className="font-medium text-slate-900">{order.plannedStartDate ? new Date(order.plannedStartDate).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Planned End</p>
              <p className="font-medium text-slate-900">{order.plannedEndDate ? new Date(order.plannedEndDate).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Work Center</p>
              <p className="font-medium text-slate-900">{order.workCenter || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Supervisor</p>
              <p className="font-medium text-slate-900">{order.supervisor || '-'}</p>
            </div>
          </CardContent>
        </SectionCard>

        {/* Quantity Tracking */}
        <SectionCard className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Production Quantities</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Planned Quantity</p>
              <p className="text-2xl font-semibold text-blue-600">{order.plannedQuantity}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Started Quantity</p>
              <p className="text-2xl font-semibold text-amber-600">{order.startedQuantity}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Completed Quantity</p>
              <p className="text-2xl font-semibold text-emerald-600">{order.completedQuantity}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Rejected Quantity</p>
              <p className="text-2xl font-semibold text-red-600">{order.rejectedQuantity}</p>
            </div>
          </CardContent>
        </SectionCard>

        {/* Executions List */}
        <SectionCard className="col-span-1 md:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Executions</CardTitle>
            <CardDescription>Material consumption and production tracking.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {execsLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
            ) : executions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Factory className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Executions Found</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Start this order to begin execution tracking, material consumption, and production completion.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Execution Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead className="text-right">Produced / Rejected</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((exec: any) => (
                    <TableRow key={exec.id}>
                      <TableCell className="font-medium">{exec.executionNumber}</TableCell>
                      <TableCell>{getStatusBadge(exec.status)}</TableCell>
                      <TableCell>{exec.startedAt ? formatDateTime(exec.startedAt) : '-'}</TableCell>
                      <TableCell>{exec.completedAt ? formatDateTime(exec.completedAt) : '-'}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-medium">{exec.producedQuantity || 0}</span>
                        {' / '}
                        <span className="text-red-600 font-medium">{exec.rejectedQuantity || 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={ROUTES.PRODUCTION_EXECUTION_DETAIL(exec.id)}>
                          <Button variant="ghost" size="sm">View Details</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </SectionCard>
      </div>

      {/* Action Dialogs */}
      <Modal 
        isOpen={activeAction === "start"} 
        onClose={() => setActiveAction(null)}
        title="Start Production Order"
        description="Specify the quantity being started."
      >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Started Quantity</label>
              <Input 
                type="number" 
                step="0.01" 
                value={startQty} 
                onChange={e => setStartQty(e.target.value)} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setActiveAction(null)}>Cancel</Button>
            <Button 
              onClick={() => startMutation.mutate(Number(startQty))} 
              disabled={startMutation.isPending || !startQty || Number(startQty) <= 0}
            >
              {startMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Start
            </Button>
          </div>
      </Modal>

      <Modal 
        isOpen={activeAction === "complete"} 
        onClose={() => setActiveAction(null)}
        title="Complete Production Order"
        description="Record the final completed and rejected quantities. This may trigger inventory receipts."
      >
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Completed Quantity</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={completeQty} 
                  onChange={e => setCompleteQty(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejected Quantity</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={rejectQty} 
                  onChange={e => setRejectQty(e.target.value)} 
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setActiveAction(null)}>Cancel</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => completeMutation.mutate({ 
                completedQuantity: Number(completeQty), 
                rejectedQuantity: Number(rejectQty) 
              })} 
              disabled={completeMutation.isPending || completeQty === ""}
            >
              {completeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Completion
            </Button>
          </div>
      </Modal>

      <Modal 
        isOpen={activeAction === "cancel"} 
        onClose={() => setActiveAction(null)}
        title="Cancel Production Order"
        description="Are you sure you want to cancel this order? Please provide a reason."
      >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cancellation Reason <span className="text-red-500">*</span></label>
              <Textarea 
                value={cancelReason} 
                onChange={e => setCancelReason(e.target.value)} 
                placeholder="Why is this order being cancelled?"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setActiveAction(null)}>Back</Button>
            <Button 
              variant="destructive"
              onClick={() => cancelMutation.mutate(cancelReason)} 
              disabled={cancelMutation.isPending || cancelReason.trim().length === 0}
            >
              {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Cancellation
            </Button>
          </div>
      </Modal>

    </PageContainer>
  );
};

