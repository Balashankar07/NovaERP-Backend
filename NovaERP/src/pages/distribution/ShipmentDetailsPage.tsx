import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Truck, CheckCircle, XCircle, Send, PackageCheck, AlertCircle, 
  FileText, MapPin, Building2, Printer, User, Phone, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { shipmentsApi } from "@/api/shipments.api";
import { ShipmentDto, ShipmentStatus, DeliverShipmentDto } from "@/types/shipments.types";
import { formatDate } from "@/utils/formatters";

import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { PermissionButton } from "@/components/common/permission-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

const getStatusBadge = (status: ShipmentStatus) => {
  switch (status) {
    case ShipmentStatus.Pending: return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3"/> Pending</Badge>;
    case ShipmentStatus.Dispatched: return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1 w-fit"><Truck className="w-3 h-3"/> Dispatched</Badge>;
    case ShipmentStatus.Delivered: return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> Delivered</Badge>;
    case ShipmentStatus.Cancelled: return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/> Cancelled</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export function ShipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [shipment, setShipment] = useState<ShipmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Delivery Dialog State (Proof of Delivery / POD)
  const [isDeliverDialogOpen, setIsDeliverDialogOpen] = useState(false);
  const [receivedBy, setReceivedBy] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (id) loadShipment();
  }, [id]);

  const loadShipment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shipmentsApi.getById(id!);
      setShipment(data);
    } catch (err: any) {
      setError(err.message || "Failed to load shipment details.");
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
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      await loadShipment();
      toast.success("Action completed successfully.");
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeliver = async () => {
    if (!shipment) return;
    
    const payload: DeliverShipmentDto = {
      deliveredItems: shipment.shipmentItems.map(i => ({
        shipmentItemId: i.id,
        deliveredQuantity: i.quantity
      }))
    };
    
    setIsDeliverDialogOpen(false);
    handleAction(async () => {
      await shipmentsApi.deliver(shipment.id, payload);
      toast.success(`Proof of Delivery recorded. Signee: ${receivedBy || "Recipient Representative"}`);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView title="Error" message={error} onRetry={loadShipment} />;
  if (!shipment) return <ErrorView title="Not Found" message="Shipment not found" />;

  const isPending = shipment.status === ShipmentStatus.Pending;
  const isDispatched = shipment.status === ShipmentStatus.Dispatched;
  const isDelivered = shipment.status === ShipmentStatus.Delivered;

  const totalUnitsShipped = shipment.shipmentItems?.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0) || 0;

  return (
    <PageContainer>
      <PageHeader
        title={`Shipment: ${shipment.trackingNumber}`}
        description={
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 font-medium">Origin Sales Order:</span>
            <Link 
              to={`/sales/orders/${shipment.salesOrderId}`} 
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 font-mono"
            >
              <FileText className="w-3.5 h-3.5" />
              {shipment.orderNumber ? `SO-${shipment.orderNumber}` : shipment.salesOrderId}
            </Link>
          </div>
        }
        backLink="/distribution/shipments"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 text-xs gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Print Packing Slip / BOL
            </Button>

            {isPending && (
              <>
                <PermissionButton
                  permission="Permissions.Shipments.Dispatch"
                  onClick={() => handleAction(() => shipmentsApi.dispatch(shipment.id), "Dispatch this shipment? This will deduct physical inventory from warehouse stock.")}
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Dispatch Freight
                </PermissionButton>
                <PermissionButton
                  permission="Permissions.Shipments.Cancel"
                  variant="outline"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 text-xs"
                  onClick={() => handleAction(() => shipmentsApi.cancel(shipment.id), "Cancel this shipment? Stock reservations will remain intact.")}
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Cancel Shipment
                </PermissionButton>
              </>
            )}

            {isDispatched && (
              <PermissionButton
                permission="Permissions.Shipments.Deliver"
                onClick={() => setIsDeliverDialogOpen(true)}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs"
              >
                <PackageCheck className="w-4 h-4 mr-1.5" />
                Confirm Delivery (POD)
              </PermissionButton>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items & Consignee */}
        <div className="lg:col-span-2 space-y-6">
          {/* Destination & Consignee Facility Card */}
          <SectionCard title="Destination & Consignee Facility">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{shipment.customerName || "B2B Distributor Account"}</span>
                </div>
                {shipment.contactPerson && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 pl-6">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Attn: {shipment.contactPerson}</span>
                  </div>
                )}
                {shipment.contactPhone && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 pl-6">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{shipment.contactPhone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4 pt-2 md:pt-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Logistics Receiving Dock</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pl-5 font-medium">
                  {shipment.shippingAddress || "Verified Delivery Dock Address on Commercial Sales Order"}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Shipment Items Table */}
          <SectionCard 
            title={`Shipment Manifest (${totalUnitsShipped} total unit${totalUnitsShipped === 1 ? "" : "s"})`}
          >
            {!shipment.shipmentItems || shipment.shipmentItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No items found in this shipment manifest.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Description</TableHead>
                    <TableHead className="text-right">Qty Shipped</TableHead>
                    <TableHead className="text-right">Qty Delivered</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipment.shipmentItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs">
                            {item.productName || item.productId}
                          </span>
                          {item.productCode && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              SKU: {item.productCode}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-slate-800">
                        {item.quantity} ea
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-600">
                        {item.deliveredQuantity} ea
                      </TableCell>
                      <TableCell className="text-center">
                        {item.deliveredQuantity >= item.quantity ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            Delivered
                          </Badge>
                        ) : isDispatched ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                            In Transit
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                            Staged
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </div>

        {/* Right Col: Logistics & Freight Details */}
        <div className="space-y-6">
          <SectionCard title="Logistics Waybill Details">
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Logistics Status</p>
                <div className="mt-1">{getStatusBadge(shipment.status)}</div>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 font-medium">Carrier Tracking Number</p>
                <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{shipment.trackingNumber}</p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 font-medium">Assigned Freight Carrier</p>
                <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-800">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{shipment.courierName || "Standard Freight Dock Dispatch"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 font-medium">Dispatch Date (Dock Out)</p>
                <div className="flex items-center gap-1.5 mt-0.5 font-medium text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{shipment.dispatchDate ? formatDate(shipment.dispatchDate) : "Awaiting Dock Dispatch"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 font-medium">Delivery Date (POD Confirmed)</p>
                <div className="flex items-center gap-1.5 mt-0.5 font-medium text-slate-800">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{shipment.deliveryDate ? formatDate(shipment.deliveryDate) : "In Transit / Not Delivered"}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Quick Traceability Summary */}
          <SectionCard title="Freight Governance">
            <div className="space-y-2 text-xs text-slate-500">
              <p>• Inventory movement GL ledger is journalized automatically upon Freight Dispatch.</p>
              <p>• Delivery confirmation signals Accounts Receivable (Finance) for commercial invoice release.</p>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Proof of Delivery (POD) Dialog */}
      {isDeliverDialogOpen && (
        <Modal
          isOpen={isDeliverDialogOpen}
          onClose={() => setIsDeliverDialogOpen(false)}
          title="Confirm Freight Delivery (POD)"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Recording delivery confirms receipt of goods by the customer consignee and updates the origin sales order status.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Actual Delivery Date *</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Received By / Signee Name *</Label>
              <Input
                type="text"
                placeholder="e.g., John Sales, Dock Supervisor, Security Gate 3..."
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Consignee: {shipment.customerName || "Customer Account"}</span>
              </p>
              <p className="text-[11px] text-emerald-700 pl-5">
                Full quantity ({totalUnitsShipped} unit{totalUnitsShipped === 1 ? "" : "s"}) will be marked received.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeliverDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDeliver}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {actionLoading ? "Recording POD..." : "Confirm & Save POD"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
