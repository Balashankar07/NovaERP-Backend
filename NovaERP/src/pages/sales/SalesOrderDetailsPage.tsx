import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Send, CheckCircle, XCircle, FileText, ShoppingCart, Clock, CheckCircle2, FileArchive, Box, Truck, ShieldAlert, ShieldCheck, Sliders, Shield, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import { salesApi } from "@/api/sales.api";
import { SalesOrderDto, SalesOrderStatus } from "@/types/sales.types";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency, formatDate } from "@/utils/formatters";

import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { PermissionButton } from "@/components/common/permission-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SalesOrderFormDialog } from "./components/SalesOrderFormDialog";
import { CreateShipmentDialog } from "../distribution/components/CreateShipmentDialog";

const getStatusBadge = (status: string) => {
  switch (status) {
    case SalesOrderStatus.Draft:
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> Draft</Badge>;
    case SalesOrderStatus.PendingApproval:
      return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</Badge>;
    case SalesOrderStatus.Approved:
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
    case SalesOrderStatus.Reserved:
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1 w-fit"><Box className="w-3 h-3" /> Reserved</Badge>;
    case SalesOrderStatus.PartiallyShipped:
      return <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1 w-fit"><ShoppingCart className="w-3 h-3" /> Partial</Badge>;
    case SalesOrderStatus.Completed:
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 w-fit"><FileArchive className="w-3 h-3" /> Completed</Badge>;
    case SalesOrderStatus.Rejected:
    case SalesOrderStatus.Cancelled:
      return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> {status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

import { useQueryClient } from "@tanstack/react-query";

export function SalesOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const [order, setOrder] = useState<SalesOrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateShipmentOpen, setIsCreateShipmentOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  const { user } = useAuth();
  const currentUserId = user?.userId ? String(user.userId).toLowerCase() : "";
  const orderCreatedBy = order?.createdBy ? String(order.createdBy).toLowerCase() : "";
  const isCreator = !!currentUserId && !!orderCreatedBy && currentUserId === orderCreatedBy;
  const isSuperAdmin = user?.role?.toLowerCase().includes("admin") || false;
  // Under Option 1 Strict Enterprise (4-Eyes Principle), creator cannot approve their own order unless Super Admin
  const canApprove = hasPermission("Permissions.SalesOrders.Approve") && (!isCreator || isSuperAdmin);

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await salesApi.getSalesOrderById(id!);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || "Failed to load sales order");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionFn: () => Promise<any>, confirmMessage?: string) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    
    try {
      setActionLoading(true);
      await actionFn();
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      await loadOrder();
      toast.success("Action completed successfully.");
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView title="Error" message={error} onRetry={loadOrder} />;
  if (!order) return <ErrorView title="Not Found" message="Sales order not found" />;

  const statusStr = String(order.status).toLowerCase();
  const isDraft = statusStr === '0' || statusStr === 'draft';
  const isPending = statusStr === '1' || statusStr === 'pendingapproval';
  const isApproved = statusStr === '2' || statusStr === 'approved';
  const isReserved = statusStr === '3' || statusStr === 'reserved';
  const isPartiallyShipped = statusStr === '5' || statusStr === 'partiallyshipped';
  const isCompleted = statusStr === '6' || statusStr === 'completed';
  const isCancelled = statusStr === '8' || statusStr === 'cancelled';

  return (
    <PageContainer>
      <PageHeader
        title={`Sales Order: ${order.orderNumber}`}
        description="View and manage sales order details."
        backLink="/sales/orders"
        actions={
          <div className="flex items-center gap-2">
            {isDraft && (
              <>
                <PermissionButton
                  permission="Permissions.SalesOrders.Update"
                  variant="outline"
                  onClick={() => setIsEditOpen(true)}
                  disabled={actionLoading}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </PermissionButton>
                <PermissionButton
                  permission="Permissions.SalesOrders.Delete"
                  variant="outline"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => handleAction(() => salesApi.deleteSalesOrder(order.id).then(() => navigate('/sales/orders')), "Delete this order?")}
                  disabled={actionLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </PermissionButton>
                <PermissionButton
                  permission="Permissions.SalesOrders.Submit"
                  onClick={() => handleAction(() => salesApi.submitSalesOrder(order.id))}
                  disabled={actionLoading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Approval
                </PermissionButton>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPolicyModalOpen(true)}
              className="h-9 text-xs gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              Approval Policy
            </Button>

            {isPending && (
              <>
                {canApprove ? (
                  <>
                    <PermissionButton
                      permission="Permissions.SalesOrders.Approve"
                      variant="outline"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => handleAction(() => salesApi.rejectSalesOrder(order.id))}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </PermissionButton>
                    <PermissionButton
                      permission="Permissions.SalesOrders.Approve"
                      onClick={() => handleAction(() => salesApi.approveSalesOrder(order.id))}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </PermissionButton>
                  </>
                ) : isCreator ? (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs shadow-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>Awaiting Independent Approval (4-Eyes Principle)</span>
                        <Badge variant="outline" className="bg-amber-100/60 text-amber-800 border-amber-300 text-[10px] py-0 px-1.5 h-4">
                          Self-Approval Blocked
                        </Badge>
                      </div>
                      <p className="text-[11px] text-amber-700/90 mt-0.5">
                        You created this order. Under corporate Segregation of Duties (SoD), an independent approver (Sales Manager or Super Admin) must review & approve it.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs shadow-xs">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>Awaiting Commercial Approval</span>
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] py-0 px-1.5 h-4">
                          Sales Manager
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Commercial sign-off is required from an authorized Sales Manager before inventory reservation.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {isApproved && (
              <>
                {hasPermission("Permissions.SalesOrders.Reserve") ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs shadow-xs">
                      <Box className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">Action Required: Ready for Physical Bin Allocation</span>
                    </div>
                    <PermissionButton
                      permission="Permissions.SalesOrders.Reserve"
                      onClick={() => handleAction(() => salesApi.reserveSalesOrder(order.id))}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Box className="w-4 h-4 mr-2" />
                      Reserve Warehouse Stock
                    </PermissionButton>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-50/90 border border-blue-200/80 text-blue-900 text-xs shadow-xs">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>Order Approved — Handed off to Warehouse</span>
                        <Badge variant="outline" className="bg-blue-100/60 text-blue-800 border-blue-300 text-[10px] py-0 px-1.5 h-4">
                          Warehouse Fulfillment
                        </Badge>
                      </div>
                      <p className="text-[11px] text-blue-700/90 mt-0.5">
                        Commercial sign-off is complete. Physical inventory allocation and dispatch are restricted to the Warehouse Manager.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {(isReserved || isPartiallyShipped) && (
              <>
                <PermissionButton
                  permission="Permissions.Shipments.Create"
                  onClick={() => setIsCreateShipmentOpen(true)}
                  disabled={actionLoading}
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Create Shipment
                </PermissionButton>
                {!hasPermission("Permissions.Shipments.Create") && (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-indigo-50/90 border border-indigo-200/80 text-indigo-900 text-xs shadow-xs">
                    <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>Stock Reserved — Ready for Dispatch</span>
                        <Badge variant="outline" className="bg-indigo-100/60 text-indigo-800 border-indigo-300 text-[10px] py-0 px-1.5 h-4">
                          Logistics Dispatch
                        </Badge>
                      </div>
                      <p className="text-[11px] text-indigo-700/90 mt-0.5">
                        Inventory allocated in warehouse bins. Outbound dispatch is managed by Warehouse & Logistics.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {!isCancelled && !isCompleted && !isPartiallyShipped && (
              <PermissionButton
                permission="Permissions.SalesOrders.Cancel"
                variant="outline"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => handleAction(() => salesApi.cancelSalesOrder(order.id, "User cancelled"), "Cancel this order? Stock reservations will be released.")}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Order
              </PermissionButton>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <SectionCard title="Order Items">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Disc/Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Reserved/Shipped</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{item.productName}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice, order.currency)}
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-sm">
                      -{formatCurrency(item.discount, order.currency)} / +{formatCurrency(item.tax, order.currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900">
                      {formatCurrency(item.totalPrice, order.currency)}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      Res: {item.reservedQuantity}<br/>
                      Ship: {item.shippedQuantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-end mt-4 text-sm">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount:</span>
                  <span>-{formatCurrency(order.discountAmount, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax:</span>
                  <span>+{formatCurrency(order.taxAmount, order.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(order.totalAmount, order.currency)}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Order Details">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <div className="mt-1">{getStatusBadge(order.status)}</div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500">Order Number</p>
                <p className="text-sm font-mono mt-1">{order.orderNumber}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Customer</p>
                <p className="text-sm mt-1">{order.distributorName}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Order Date</p>
                <p className="text-sm mt-1">{formatDate(order.orderDate)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Required Delivery</p>
                <p className="text-sm mt-1">{order.requiredDeliveryDate ? formatDate(order.requiredDeliveryDate) : "-"}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-slate-500 mb-1">Billing Address</p>
                <p className="text-sm whitespace-pre-wrap">{order.billingAddress || "N/A"}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-slate-500 mb-1">Shipping Address</p>
                <p className="text-sm whitespace-pre-wrap">{order.shippingAddress || "N/A"}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-slate-500 mb-1">Remarks</p>
                <p className="text-sm whitespace-pre-wrap">{order.remarks || "No remarks"}</p>
              </div>
            </div>
          </SectionCard>

          {/* Commercial Governance & Audit Card */}
          <SectionCard title="Commercial Governance & Audit">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Order Creator:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {isCreator ? "You" : (order.createdByName || "Sales Department")}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">4-Eyes Policy:</span>
                <span className="font-medium">
                  {isCreator && !isSuperAdmin ? (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[11px] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Independent Approver Required
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Maker-Checker Segregated
                    </Badge>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Approval Sign-off:</span>
                <span className="font-medium">
                  {isApproved || isReserved || isPartiallyShipped || isCompleted ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Authorized {order.approvedByName ? `(${order.approvedByName})` : ""}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">Pending Sign-off</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Warehouse Hand-off:</span>
                <span className="text-slate-700 font-medium">
                  {isReserved || isPartiallyShipped || isCompleted ? "Stock Allocated (Warehouse)" : isApproved ? "Awaiting Warehouse Allocation" : "Awaiting Commercial Approval"}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {isEditOpen && (
        <SalesOrderFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          orderToEdit={order}
          onSuccess={() => {
            setIsEditOpen(false);
            loadOrder();
          }}
        />
      )}

      {isCreateShipmentOpen && (
        <CreateShipmentDialog
          open={isCreateShipmentOpen}
          onOpenChange={setIsCreateShipmentOpen}
          salesOrder={order}
          onSuccess={() => {
            setIsCreateShipmentOpen(false);
            loadOrder();
          }}
        />
      )}

      {/* Commercial Approval Policy & Governance Modal */}
      {isPolicyModalOpen && (
        <Modal
          isOpen={isPolicyModalOpen}
          onClose={() => setIsPolicyModalOpen(false)}
          title="Commercial & Operational Governance Policy"
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-indigo-950 text-sm">Role-Based Operational Segregation</h4>
                <p className="text-indigo-800/90 text-xs mt-0.5 leading-relaxed">
                  NovaERP partitions commercial commitments and physical inventory operations across specialized departments to satisfy SOX 404, ISO 9001, and anti-fraud operational controls without administrative bottlenecks.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm">1. Commercial Authority (Sales Manager)</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]">Authorized</Badge>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  The Sales Manager holds departmental sign-off authority for pricing, contract terms, and order approval. No IT/Admin intervention is needed for standard commercial operations.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm">2. Inventory Allocation Boundary (Warehouse Manager)</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[11px]">Restricted to Warehouse</Badge>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Sales personnel cannot touch physical inventory or reserve warehouse bins. Physical inventory reservation is strictly segregated and executed by the Warehouse Manager after commercial sign-off.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm">3. Logistics Freight Dispatch (Warehouse Manager)</span>
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[11px]">Restricted to Logistics</Badge>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Outbound shipment creation, Bill of Lading (BOL) generation, packing lists, and loading dock dispatching are strictly handled by Warehouse and Logistics personnel.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                size="sm"
                onClick={() => setIsPolicyModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Close Policy Guide
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
