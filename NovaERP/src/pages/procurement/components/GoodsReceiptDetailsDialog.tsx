import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Send, FileText, Trash2, ShieldCheck, Box } from "lucide-react";
import { GoodsReceiptDto, GoodsReceiptStatus } from "@/types/goodsReceipts.types";
import { goodsReceiptsApi } from "@/api/goodsReceipts.api";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/utils/formatters";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PermissionButton } from "@/components/common/permission-button";

import { useQueryClient } from "@tanstack/react-query";

interface GoodsReceiptDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grnId: string;
  onUpdate: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case GoodsReceiptStatus.Draft:
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
    case GoodsReceiptStatus.Completed:
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
    case GoodsReceiptStatus.Cancelled:
      return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function GoodsReceiptDetailsDialog({
  open,
  onOpenChange,
  grnId,
  onUpdate
}: GoodsReceiptDetailsDialogProps) {
  const [grn, setGrn] = useState<GoodsReceiptDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const loadGrn = async () => {
    setIsLoading(true);
    try {
      const res = await goodsReceiptsApi.getById(grnId);
      setGrn(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && grnId) {
      loadGrn();
    }
  }, [open, grnId]);

  const handleAction = async (action: 'receive' | 'cancel' | 'delete', fn: () => Promise<any>) => {
    const isDestructive = action === 'delete' || action === 'cancel';
    if (isDestructive && !window.confirm(`Are you sure you want to ${action} this goods receipt?`)) {
      return;
    }

    try {
      await fn();
      toast.success(`Goods receipt ${action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      onUpdate();
      if (action === 'delete') {
        onOpenChange(false);
      } else {
        loadGrn();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} goods receipt`);
    }
  };

  if (!grn) return null;

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-slate-500" />
          {grn.grnNumber}
          {getStatusBadge(grn.status)}
        </div>
      }
      size="xl"
    >
      <div className="flex gap-2 items-center justify-end mb-4">
        {grn.status === GoodsReceiptStatus.Draft && (
          <>
            <PermissionButton
              permission="Permissions.GoodsReceipts.Receive"
              onClick={() => handleAction('receive', () => goodsReceiptsApi.receive(grn.id))}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Post Receipt
            </PermissionButton>
            <PermissionButton
              permission="Permissions.GoodsReceipts.Cancel"
              onClick={() => handleAction('cancel', () => goodsReceiptsApi.cancel(grn.id))}
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </PermissionButton>
            <PermissionButton
              permission="Permissions.GoodsReceipts.Delete"
              onClick={() => handleAction('delete', () => goodsReceiptsApi.delete(grn.id))}
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </PermissionButton>
          </>
        )}
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/60 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">PO Number</p>
            <p className="font-semibold text-slate-900 text-base">{grn.purchaseOrderNumber}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Supplier</p>
            <p className="font-semibold text-slate-900 text-base">{grn.supplierName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Receipt Date</p>
            <p className="font-semibold text-slate-900 text-base">{formatDate(grn.receiptDate)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Remarks</p>
            <p className="font-semibold text-slate-900 text-base">{grn.remarks || "-"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Received Items</h3>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium rounded-full px-2.5">
              {(grn.items || []).length}
            </Badge>
          </div>
          
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 pl-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Product</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Code</TableHead>
                  <TableHead className="py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Ordered</TableHead>
                  <TableHead className="py-4 text-right text-xs font-semibold uppercase tracking-wider text-emerald-600">Received</TableHead>
                  <TableHead className="py-4 text-right text-xs font-semibold uppercase tracking-wider text-rose-600">Rejected</TableHead>
                  <TableHead className="py-4 pr-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(grn.items || []).map((item) => (
                  <TableRow key={item.id} className="transition-colors hover:bg-slate-50/60">
                    <TableCell className="py-4 pl-6 font-medium text-slate-900">{item.productName}</TableCell>
                    <TableCell className="py-4 text-slate-500 text-sm font-mono">{item.productCode}</TableCell>
                    <TableCell className="py-4 text-right font-medium text-slate-600">{item.orderedQuantity}</TableCell>
                    <TableCell className="py-4 text-right font-bold text-emerald-600 bg-emerald-50/10">{item.receivedQuantity}</TableCell>
                    <TableCell className="py-4 text-right font-bold text-rose-600 bg-rose-50/10">{item.rejectedQuantity}</TableCell>
                    <TableCell className="py-4 pr-6 text-sm text-slate-500 italic">{item.remarks || "-"}</TableCell>
                  </TableRow>
                ))}
                {(grn.items || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-12">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Box className="w-8 h-8 text-slate-300" />
                        <p>No items found in this receipt.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
