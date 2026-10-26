import { useState, useEffect } from "react";
import { goodsReceiptsApi } from "@/api/goodsReceipts.api";
import { purchaseOrdersApi } from "@/api/purchaseOrders.api";
import { api } from "@/lib/api-helper";
import { API_ENDPOINTS } from "@/api/endpoints";
import { GoodsReceiptDto } from "@/types/goodsReceipts.types";
import { PurchaseOrderDto, PurchaseOrderStatus } from "@/types/purchaseOrders.types";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingView } from "@/components/ui/state-views";
import { Save, Building2, MapPin } from "lucide-react";

interface LineItem {
  purchaseOrderItemId: string;
  productName: string;
  ordered: number;
  alreadyReceived: number;
  outstanding: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  remarks: string;
}

interface GoodsReceiptFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: GoodsReceiptDto;
}

export function GoodsReceiptFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: GoodsReceiptFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPOs, setIsLoadingPOs] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderDto | null>(null);

  // Controlled form state
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouseLocationId, setWarehouseLocationId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPurchaseOrderId("");
      setWarehouseId("");
      setWarehouseLocationId("");
      setRemarks("");
      setLineItems([]);
      setSelectedPo(null);
      fetchPurchaseOrders();
      fetchWarehouses();
    }
  }, [open]);

  // Load PO line items when PO selected
  useEffect(() => {
    if (!purchaseOrderId) {
      setLineItems([]);
      return;
    }
    setIsLoadingItems(true);
    purchaseOrdersApi.getById(purchaseOrderId)
      .then(po => {
        if (!po) return;
        setSelectedPo(po);
        const items: LineItem[] = (po.items || []).map(item => {
          const outstanding = Math.max(0, item.quantity - (item.receivedQuantity || 0));
          return {
            purchaseOrderItemId: item.id,
            productName: item.productName,
            ordered: item.quantity,
            alreadyReceived: item.receivedQuantity || 0,
            outstanding,
            receivedQuantity: outstanding,
            rejectedQuantity: 0,
            remarks: ""
          };
        });
        setLineItems(items);
      })
      .catch(err => {
        console.error("Failed to fetch PO details:", err);
        toast.error("Failed to load purchase order items.");
      })
      .finally(() => setIsLoadingItems(false));
  }, [purchaseOrderId]);

  // Load locations when warehouse selected
  useEffect(() => {
    if (!warehouseId) {
      setLocations([]);
      setWarehouseLocationId("");
      return;
    }
    api.get<any>(`${API_ENDPOINTS.WAREHOUSE_LOCATIONS.BASE}/warehouse/${warehouseId}`, { params: { pageSize: 100 } })
      .then(res => setLocations(res.items || []))
      .catch(err => console.error(err));
  }, [warehouseId]);

  const fetchPurchaseOrders = async () => {
    setIsLoadingPOs(true);
    try {
      const res = await purchaseOrdersApi.getAll({ pageSize: 100, sortBy: 'OrderDate', sortOrder: 'desc' });
      const validPOs = (res.items || []).filter(po =>
        po.status === PurchaseOrderStatus.Approved ||
        po.status === PurchaseOrderStatus.Sent ||
        po.status === PurchaseOrderStatus.PartiallyReceived
      );
      setPurchaseOrders(validPOs);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingPOs(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get<any>(API_ENDPOINTS.WAREHOUSES.BASE, { params: { pageSize: 100 } });
      setWarehouses(res.items || []);
    } catch (error) {
      console.error(error);
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: number | string) => {
    setLineItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!purchaseOrderId) {
      toast.error("Please select a Purchase Order.");
      return;
    }
    if (!warehouseId) {
      toast.error("Please select a Warehouse.");
      return;
    }

    const itemsToReceive = lineItems.filter(item => item.receivedQuantity > 0);
    if (itemsToReceive.length === 0) {
      toast.error("You must receive at least 1 unit of an item to save.");
      return;
    }

    const hasInvalidQty = lineItems.some(item => item.receivedQuantity < 0 || item.receivedQuantity > item.outstanding);
    if (hasInvalidQty) {
      toast.error("Received quantity cannot exceed outstanding quantity or be negative.");
      return;
    }

    const payload = {
      purchaseOrderId,
      warehouseId,
      warehouseLocationId: warehouseLocationId || undefined,
      remarks: remarks || undefined,
      items: itemsToReceive.map(item => ({
        purchaseOrderItemId: item.purchaseOrderItemId,
        receivedQuantity: Number(item.receivedQuantity),
        rejectedQuantity: Number(item.rejectedQuantity),
        remarks: item.remarks || undefined
      }))
    };

    console.log("Submitting GRN payload:", JSON.stringify(payload, null, 2));

    try {
      setIsSubmitting(true);
      if (initialData) {
        await goodsReceiptsApi.update(initialData.id, payload as any);
        toast.success("Goods Receipt updated successfully");
      } else {
        await goodsReceiptsApi.create(payload as any);
        toast.success("Goods Receipt saved as Draft!");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      // api-helper normalizes errors into ApiError with .message
      console.error("GRN Submit Error:", error);
      toast.error(error.message || "Operation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={initialData ? "Edit Goods Receipt" : "Create Goods Receipt"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        {selectedPo && (
          <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50 to-white border border-indigo-100/90 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-700 shadow-sm animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-indigo-100/70 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Inbound From: {selectedPo.supplierName}</span>
              </div>
              <span className="font-mono text-slate-500">PO: #{selectedPo.orderNumber}</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-600 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-700">Dock Receiving Target: </strong>
                {warehouses.find(w => w.id === warehouseId)?.name || "Central Receiving Warehouse"} 
                {warehouses.find(w => w.id === warehouseId)?.address ? ` • ${warehouses.find(w => w.id === warehouseId).address}` : ""}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Purchase Order */}
          <div className="space-y-2">
            <Label>Purchase Order</Label>
            <Select
              value={purchaseOrderId}
              onValueChange={setPurchaseOrderId}
              disabled={isLoadingPOs || !!initialData}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingPOs ? "Loading..." : "Select Purchase Order"} />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrders.map(po => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.poNumber} ({po.supplierName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warehouse */}
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(wh => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.warehouseName || wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Usable Storage Location */}
          <div className="space-y-2">
            <Label>Target Putaway Location (Optional)</Label>
            <Select
              value={warehouseLocationId}
              onValueChange={setWarehouseLocationId}
              disabled={!warehouseId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Destination Bin (after QC)" />
              </SelectTrigger>
              <SelectContent>
                {locations
                  .filter(loc => !loc.isQuarantine && !loc.locationCode?.toLowerCase().includes("quarantine") && !loc.locationName?.toLowerCase().includes("quarantine"))
                  .map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.locationName || loc.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Optional remarks"
            />
          </div>
        </div>

        {/* Line Items */}
        {isLoadingItems ? (
          <LoadingView title="Loading items from Purchase Order..." />
        ) : lineItems.length > 0 ? (
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-24 text-right">Ordered</TableHead>
                  <TableHead className="w-24 text-right">Outstanding</TableHead>
                  <TableHead className="w-32">Receiving</TableHead>
                  <TableHead className="w-32">Rejected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow key={item.purchaseOrderItemId}>
                    <TableCell className="font-medium text-sm">{item.productName}</TableCell>
                    <TableCell className="text-right text-sm">{item.ordered}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{item.outstanding}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max={item.outstanding}
                        value={item.receivedQuantity}
                        onChange={e => updateLineItem(index, "receivedQuantity", Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={item.rejectedQuantity}
                        onChange={e => updateLineItem(index, "rejectedQuantity", Number(e.target.value))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : purchaseOrderId ? (
          <p className="text-sm text-center text-slate-500 py-4">No outstanding items found for this Purchase Order.</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || lineItems.length === 0}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
