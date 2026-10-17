import { useEffect, useState } from "react";
import { purchaseRequestsApi } from "@/api/purchaseRequests.api";
import { PurchaseRequestDto, PurchaseRequestStatus } from "@/types/purchaseRequests.types";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { FileText, CheckCircle, XCircle, Send, CheckCircle2, Calendar, User, AlignLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

interface PurchaseRequestDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequestId: string;
  onStatusChange?: () => void;
}

export function PurchaseRequestDetailsDialog({ isOpen, onClose, purchaseRequestId, onStatusChange }: PurchaseRequestDetailsDialogProps) {
  const { hasPermission } = usePermissions();
  const [pr, setPR] = useState<PurchaseRequestDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchPR = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await purchaseRequestsApi.getById(purchaseRequestId);
      setPR(data);
    } catch (err: any) {
      setError(err.message || "Failed to load Purchase Request");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && purchaseRequestId) {
      fetchPR();
    }
  }, [isOpen, purchaseRequestId]);

  const handleAction = async (action: 'submit' | 'approve' | 'reject') => {
    setIsActionLoading(true);
    try {
      if (action === 'submit') await purchaseRequestsApi.submit(purchaseRequestId);
      if (action === 'approve') await purchaseRequestsApi.approve(purchaseRequestId);
      if (action === 'reject') await purchaseRequestsApi.reject(purchaseRequestId, "Rejected by user");
      
      toast.success(`Purchase request ${action}ed successfully.`);
      if (onStatusChange) onStatusChange();
      await fetchPR();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} PR.`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const title = isLoading ? "Purchase Request Details" : error || !pr ? "Purchase Request Details" : `Purchase Request: ${pr.requestNumber}`;
  const description = isLoading || error || !pr ? undefined : "View request details and component items.";
  const size = isLoading || error || !pr ? "3xl" : "4xl";

  const canApprove = hasPermission("Permissions.PurchaseRequests.Approve");
  const canUpdate = hasPermission("Permissions.PurchaseRequests.Update");
  const canCreatePO = hasPermission("Permissions.PurchaseOrders.Create");

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
      ) : error || !pr ? (
        <div className="h-64 flex items-center justify-center">
          <ErrorView title="Error" description={error || "Not found"} onRetry={fetchPR} />
        </div>
      ) : (
      <div className="space-y-6">
        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 truncate">
              <User className="w-3 h-3 shrink-0" /> Requested By
            </h4>
            <p className="text-sm text-slate-900 font-medium truncate" title={pr.requestedBy}>{pr.requestedBy}</p>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 truncate">
              <Calendar className="w-3 h-3 shrink-0" /> Request Date
            </h4>
            <p className="text-sm text-slate-900 font-medium truncate">{formatDate(pr.requestDate)}</p>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 truncate">
              <Calendar className="w-3 h-3 shrink-0" /> Required By
            </h4>
            <p className="text-sm text-slate-900 font-medium truncate">{formatDate(pr.requiredByDate)}</p>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 truncate">
              <AlignLeft className="w-3 h-3 shrink-0" /> Status
            </h4>
            <div>
              <Badge variant="outline" className="bg-slate-100">{pr.status}</Badge>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-4 min-w-0">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 truncate">
              <FileText className="w-3 h-3 shrink-0" /> Business Reason
            </h4>
            <p className="text-sm text-slate-900 font-medium break-words">{pr.reason}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Requested Components
            </h3>
            <Badge variant="secondary">{pr.items.length} Items</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-white uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Component</th>
                  <th className="px-4 py-3 font-medium text-right">Requested Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Approved Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Converted Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Remaining Qty</th>
                  <th className="px-4 py-3 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pr.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      <div className="text-xs text-slate-500">{item.productNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{item.requestedQuantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-indigo-700">{item.approvedQuantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700">{item.convertedQuantity}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">{item.remainingQuantity}</td>
                    <td className="px-4 py-3 text-slate-500">{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={isActionLoading}>
            Close
          </Button>

          {(pr.status === PurchaseRequestStatus.Approved.toString() || pr.status === PurchaseRequestStatus.PartiallyConverted.toString() || pr.status === 'Approved' || pr.status === 'PartiallyConverted') && canCreatePO && (
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={() => {
                window.location.href = `/procurement/orders?createFromPr=${pr.id}`;
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Create PO
            </Button>
          )}
          
          {(pr.status === PurchaseRequestStatus.Draft.toString() || pr.status === 'Draft') && canUpdate && (
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={() => handleAction('submit')}
              disabled={isActionLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          )}

          {(pr.status === PurchaseRequestStatus.PendingApproval.toString() || pr.status === 'PendingApproval') && canApprove && (
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
        </div>
      </div>
      )}
    </Modal>
  );
}
