import { useEffect, useState } from "react";
import { purchaseOrdersApi } from "@/api/purchaseOrders.api";
import { PurchaseOrderDto, PurchaseOrderStatus } from "@/types/purchaseOrders.types";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { AlertCircle, FileText, CheckCircle, XCircle, Send, CheckCircle2, FileArchive, Building2, Calendar, MapPin, Hash } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

interface PurchaseOrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  onStatusChange?: () => void;
}

export function PurchaseOrderDetailsDialog({ isOpen, onClose, purchaseOrderId, onStatusChange }: PurchaseOrderDetailsDialogProps) {
  const { hasPermission } = usePermissions();
  const [po, setPO] = useState<PurchaseOrderDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchPO = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await purchaseOrdersApi.getById(purchaseOrderId);
      setPO(data);
    } catch (err: any) {
      setError(err.message || "Failed to load Purchase Order");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && purchaseOrderId) {
      fetchPO();
    }
  }, [isOpen, purchaseOrderId]);

  const handleAction = async (action: 'submit' | 'approve' | 'reject' | 'send') => {
    setIsActionLoading(true);
    try {
      if (action === 'submit') await purchaseOrdersApi.submit(purchaseOrderId);
      if (action === 'approve') await purchaseOrdersApi.approve(purchaseOrderId);
      if (action === 'reject') await purchaseOrdersApi.reject(purchaseOrderId);
      if (action === 'send') await purchaseOrdersApi.send(purchaseOrderId);
      
      toast.success(`Purchase order ${action}ed successfully.`);
      if (onStatusChange) onStatusChange();
      await fetchPO();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} PO.`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const title = isLoading ? "Purchase Order Details" : error || !po ? "Purchase Order Details" : `Purchase Order: ${po.poNumber}`;
  const description = isLoading || error || !po ? undefined : "View full order details and line items.";
  const size = isLoading || error || !po ? "3xl" : "4xl";

  const canApprove = hasPermission("Permissions.PurchaseOrders.Approve");
  const canUpdate = hasPermission("Permissions.PurchaseOrders.Update");
  const canSubmit = hasPermission("Permissions.PurchaseOrders.Submit");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size as any}
    >
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingView title="Loading details..." />
        </div>
      ) : error || !po ? (
        <div className="h-64 flex items-center justify-center">
          <ErrorView title="Error" description={error || "Not found"} onRetry={fetchPO} />
        </div>
      ) : (
      <div className="space-y-6">
        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Supplier
            </h4>
            <p className="text-sm text-slate-900 font-medium">{po.supplierName}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Order Date
            </h4>
            <p className="text-sm text-slate-900 font-medium">{formatDate(po.orderDate)}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Expected Delivery
            </h4>
            <p className="text-sm text-slate-900 font-medium">{formatDate(po.expectedDeliveryDate)}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Hash className="w-3 h-3" /> Status
            </h4>
            <div>
              <Badge variant="outline" className="bg-slate-100">{po.status}</Badge>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Line Items
            </h3>
            <Badge variant="secondary">{(po.items || []).length} Items</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-white uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Component</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Received</th>
                  <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(po.items || []).map((item) => {
                  const isPriceOverridden = item.supplierUnitPrice && item.unitPrice !== item.supplierUnitPrice;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.productName}</div>
                        <div className="text-xs text-slate-500">{item.productCode}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{item.receivedQuantity ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-medium text-slate-900">
                          {formatCurrency(item.unitPrice, po.currency)}
                        </div>
                        {isPriceOverridden && (
                          <div className="text-[10px] text-amber-600 flex items-center justify-end gap-1 mt-0.5" title={`Approved price: ${formatCurrency(item.supplierUnitPrice!, po.currency)}`}>
                            <AlertCircle className="w-3 h-3" /> Overridden
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                        {formatCurrency(item.lineTotal, po.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-700">Total Amount</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 text-lg">
                    {formatCurrency(po.totalAmount, po.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Remarks */}
        {po.remarks && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Remarks</h4>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{po.remarks}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={isActionLoading}>
            Close
          </Button>
          
          {po.status === PurchaseOrderStatus.Draft && canUpdate && (
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={() => handleAction('submit')}
              disabled={isActionLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          )}

          {po.status === PurchaseOrderStatus.PendingApproval && canApprove && (
            <>
              <Button 
                variant="outline" 
                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                onClick={() => handleAction('reject')}
                disabled={isActionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleAction('approve')}
                disabled={isActionLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </>
          )}

          {po.status === PurchaseOrderStatus.Approved && canSubmit && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleAction('send')}
              disabled={isActionLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Order
            </Button>
          )}
        </div>
      </div>
      )}
    </Modal>
  );
}
