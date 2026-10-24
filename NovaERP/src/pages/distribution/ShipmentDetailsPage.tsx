import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Truck, CheckCircle, XCircle, Send, PackageCheck, AlertCircle } from "lucide-react";
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

const getStatusBadge = (status: ShipmentStatus) => {
  switch (status) {
    case ShipmentStatus.Pending: return <Badge variant="outline" className="bg-amber-100 text-amber-700 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3"/> Pending</Badge>;
    case ShipmentStatus.Dispatched: return <Badge variant="outline" className="bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><Truck className="w-3 h-3"/> Dispatched</Badge>;
    case ShipmentStatus.Delivered: return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> Delivered</Badge>;
    case ShipmentStatus.Cancelled: return <Badge variant="outline" className="bg-rose-100 text-rose-700 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/> Cancelled</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

import { useQueryClient } from "@tanstack/react-query";

export function ShipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [shipment, setShipment] = useState<ShipmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleDeliver = async () => {
    if (!shipment) return;
    // In a complete UI, a dialog would open to specify quantities. For simplicity in V1, auto-fill full delivery.
    if (!window.confirm("Deliver full quantity for this shipment?")) return;
    
    const payload: DeliverShipmentDto = {
      deliveredItems: shipment.shipmentItems.map(i => ({
        shipmentItemId: i.id,
        deliveredQuantity: i.quantity
      }))
    };
    
    handleAction(() => shipmentsApi.deliver(shipment.id, payload));
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView title="Error" message={error} onRetry={loadShipment} />;
  if (!shipment) return <ErrorView title="Not Found" message="Shipment not found" />;

  const isPending = shipment.status === ShipmentStatus.Pending;
  const isDispatched = shipment.status === ShipmentStatus.Dispatched;

  return (
    <PageContainer>
      <PageHeader
        title={`Shipment: ${shipment.trackingNumber}`}
        description={`Sales Order ID: ${shipment.salesOrderId}`}
        backLink="/distribution/shipments"
        actions={
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <PermissionButton
                  permission="Permissions.Shipments.Dispatch"
                  onClick={() => handleAction(() => shipmentsApi.dispatch(shipment.id), "Dispatch this shipment? This will deduct inventory.")}
                  disabled={actionLoading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Dispatch
                </PermissionButton>
                <PermissionButton
                  permission="Permissions.Shipments.Cancel"
                  variant="outline"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => handleAction(() => shipmentsApi.cancel(shipment.id), "Cancel this shipment?")}
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Shipment
                </PermissionButton>
              </>
            )}

            {isDispatched && (
              <PermissionButton
                permission="Permissions.Shipments.Deliver"
                onClick={handleDeliver}
                disabled={actionLoading}
              >
                <PackageCheck className="w-4 h-4 mr-2" />
                Mark Delivered
              </PermissionButton>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <SectionCard title="Shipment Items">
            {!shipment.shipmentItems || shipment.shipmentItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No items found in this shipment.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty Shipped</TableHead>
                    <TableHead className="text-right">Qty Delivered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipment.shipmentItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{item.productName || item.productId}</span>
                          {item.productCode && <span className="text-xs text-slate-500 font-mono">{item.productCode}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-right text-slate-500">{item.deliveredQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Details">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <div className="mt-1">{getStatusBadge(shipment.status)}</div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500">Tracking Number</p>
                <p className="text-sm font-mono mt-1">{shipment.trackingNumber}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Courier</p>
                <p className="text-sm mt-1">{shipment.courierName}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Dispatch Date</p>
                <p className="text-sm mt-1">{shipment.dispatchDate ? formatDate(shipment.dispatchDate) : "-"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Delivery Date</p>
                <p className="text-sm mt-1">{shipment.deliveryDate ? formatDate(shipment.deliveryDate) : "-"}</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}
