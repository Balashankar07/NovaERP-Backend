import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Send, CheckCircle, XCircle, FileText, ShoppingCart, Clock, CheckCircle2, FileArchive, Box, Truck } from "lucide-react";
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
    } catch (err: any) {
      alert("Action failed: " + (err.message || "Unknown error"));
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

            {isPending && (
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
            )}

            {isApproved && (
              <PermissionButton
                permission="Permissions.SalesOrders.Reserve"
                onClick={() => handleAction(() => salesApi.reserveSalesOrder(order.id))}
                disabled={actionLoading}
              >
                <Box className="w-4 h-4 mr-2" />
                Reserve Stock
              </PermissionButton>
            )}

            {(isReserved || isPartiallyShipped) && (
              <PermissionButton
                permission="Permissions.Shipments.Create"
                onClick={() => setIsCreateShipmentOpen(true)}
                disabled={actionLoading}
              >
                <Truck className="w-4 h-4 mr-2" />
                Create Shipment
              </PermissionButton>
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
    </PageContainer>
  );
}
