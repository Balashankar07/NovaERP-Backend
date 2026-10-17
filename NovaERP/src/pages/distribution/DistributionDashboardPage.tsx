import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { shipmentsApi, salesOrdersApi } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { 
  Truck, Package, Clock, CheckCircle2, Lock, CheckCircle, 
  TrendingUp, RefreshCw, Plus, ArrowUpRight, Box, 
  AlertTriangle, FileText, PackageCheck, Send, ShieldAlert
} from "lucide-react";
import { LoadingView, ErrorView } from "@/components/ui/state-views";

export function DistributionDashboardPage() {
  const queryClient = useQueryClient();
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ["distribution", "summary"],
    queryFn: () => shipmentsApi.getSummary(),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const { data: shipmentsList } = useQuery({
    queryKey: ["shipments", "recent"],
    queryFn: () => shipmentsApi.getAll({ pageNumber: 1, pageSize: 10 }),
    staleTime: 15000,
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => shipmentsApi.dispatch(id),
    onSuccess: () => {
      setDispatchingId(null);
      queryClient.invalidateQueries({ queryKey: ["distribution", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: () => {
      setDispatchingId(null);
    }
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["distribution", "summary"] });
    queryClient.invalidateQueries({ queryKey: ["shipments"] });
    queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };

  const handleDispatch = (shipmentId: string) => {
    setDispatchingId(shipmentId);
    dispatchMutation.mutate(shipmentId);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingView title="Loading Distribution & Warehouse Shipment Control Center..." />
      </PageContainer>
    );
  }

  if (isError || !summary) {
    return (
      <PageContainer>
        <ErrorView message="Failed to load Distribution Control Center data." onRetry={handleRefresh} />
      </PageContainer>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending / Draft</Badge>;
      case "Dispatched":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Dispatched</Badge>;
      case "Delivered":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Delivered</Badge>;
      case "Cancelled":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Warehouse & Distribution Control Center"
        description="Operational fulfillment control center for managing ready-to-ship demand, stock dispatches, and inventory issues."
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Link to="/distribution/shipments">
              <Truck className="h-4 w-4 mr-2" /> All Outbound Shipments
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* 8 Primary Operational KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-white border-teal-200/70 shadow-sm rounded-xl hover:border-teal-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-teal-700">Ready To Ship Orders</CardTitle>
            <PackageCheck className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-teal-600">{summary.readyToShipOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Orders with reserved stock</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-amber-200/70 shadow-sm rounded-xl hover:border-amber-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700">Draft Shipments</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600">{summary.draftShipments}</div>
            <p className="text-xs text-slate-500 mt-1">Pending dispatch execution</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-blue-200/70 shadow-sm rounded-xl hover:border-blue-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-700">Ready For Dispatch</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-600">{summary.shipmentsReadyForDispatch}</div>
            <p className="text-xs text-slate-500 mt-1">Staged & packed in warehouse</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-indigo-200/70 shadow-sm rounded-xl hover:border-indigo-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Partially Shipped</CardTitle>
            <Truck className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-indigo-600">{summary.partiallyShippedOrders}</div>
            <p className="text-xs text-slate-500 mt-1">Partial order shipments</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-purple-200/70 shadow-sm rounded-xl hover:border-purple-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-700">Dispatched Shipments</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-purple-600">{summary.dispatchedShipments}</div>
            <p className="text-xs text-slate-500 mt-1">SalesIssue posted to ledger</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200/70 shadow-sm rounded-xl hover:border-emerald-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600">{summary.completedOrders}</div>
            <p className="text-xs text-slate-500 mt-1">100% fulfilled & delivered</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Units Awaiting Dispatch</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{summary.unitsAwaitingDispatch} units</div>
            <p className="text-xs text-slate-500 mt-1">Outstanding fulfillment backlog</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Fulfillment Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              ${summary.totalShipmentFulfillmentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Dispatched & completed volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipment Pipeline & Operational Alerts */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Shipment Pipeline Stage Breakdown */}
        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-md border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-400" />
                Distribution Shipment Lifecycle Pipeline
              </CardTitle>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30">
                Authoritative Shipment State Machine
              </Badge>
            </div>
            <CardDescription className="text-slate-300 text-xs">
              Live tracking of outbound shipments across canonical ShipmentStatus states.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <p className="text-[11px] font-medium text-amber-300 uppercase tracking-wider">1. Pending / Draft</p>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {summary.shipmentPipeline?.["Pending"] ?? summary.draftShipments}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Staged for dispatch</p>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <p className="text-[11px] font-medium text-indigo-300 uppercase tracking-wider">2. Dispatched</p>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {summary.shipmentPipeline?.["Dispatched"] ?? summary.dispatchedShipments}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">SalesIssue posted</p>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <p className="text-[11px] font-medium text-emerald-300 uppercase tracking-wider">3. Delivered</p>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {summary.shipmentPipeline?.["Delivered"] ?? 0}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Customer confirmed</p>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <p className="text-[11px] font-medium text-rose-300 uppercase tracking-wider">4. Cancelled</p>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {summary.shipmentPipeline?.["Cancelled"] ?? 0}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Voided shipments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Attention Alerts */}
        <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Operational Attention Needed
              </span>
              <Badge variant="secondary" className="text-xs font-normal">
                {summary.attentionItems?.length ?? 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {!summary.attentionItems?.length ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                All distribution operations are flowing smoothly.
              </div>
            ) : (
              <div className="space-y-3">
                {summary.attentionItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                      <Badge variant="outline" className={
                        item.severity === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200 text-[10px]' :
                        item.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]' :
                        'bg-slate-100 text-slate-700 border-slate-200 text-[10px]'
                      }>
                        {item.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Operational Data Section */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Left Column: Ready-To-Ship Queue Table (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prominent Ready-To-Ship Queue */}
          <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Ready-To-Ship Sales Orders Queue</span>
                <Link to="/sales/orders" className="text-xs font-normal text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View Sales Orders <ArrowUpRight className="h-3 w-3" />
                </Link>
              </CardTitle>
              <CardDescription className="text-xs">
                Sales orders with active stock reservations awaiting shipment creation and physical dispatch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!summary.readyToShipQueue?.length ? (
                <div className="text-center py-8 text-slate-500 text-sm">No sales orders currently ready for shipment.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Order #</th>
                        <th className="p-3">Distributor</th>
                        <th className="p-3 text-right">Ordered</th>
                        <th className="p-3 text-right text-purple-700">Reserved</th>
                        <th className="p-3 text-right text-indigo-700">Shipped</th>
                        <th className="p-3 text-right text-amber-700">Remaining</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.readyToShipQueue.map((item) => (
                        <tr key={item.salesOrderId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-semibold text-slate-900">
                            <Link to={`/sales/orders/${item.salesOrderId}`} className="hover:underline text-indigo-600">
                              {item.salesOrderNumber}
                            </Link>
                          </td>
                          <td className="p-3 text-slate-700">{item.distributorName}</td>
                          <td className="p-3 text-right font-medium text-slate-800">{item.orderedQuantity}</td>
                          <td className="p-3 text-right font-semibold text-purple-600">{item.reservedQuantity}</td>
                          <td className="p-3 text-right font-semibold text-indigo-600">{item.shippedQuantity}</td>
                          <td className="p-3 text-right font-bold text-amber-600">{item.remainingQuantity}</td>
                          <td className="p-3">{getStatusBadge(item.status)}</td>
                          <td className="p-3 text-right">
                            <Button asChild size="sm" variant="outline" className="h-7 text-[11px] text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                              <Link to={`/sales/orders/${item.salesOrderId}`}>
                                Ship Order
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actionable Draft Shipments Queue */}
          <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Shipments Pending Physical Dispatch</span>
                <Link to="/distribution/shipments" className="text-xs font-normal text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Manage Shipments <ArrowUpRight className="h-3 w-3" />
                </Link>
              </CardTitle>
              <CardDescription className="text-xs">
                Dispatching consumes InventoryReservation and posts authoritative SalesIssue movement to reduce physical OnHand stock.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!shipmentsList?.items?.filter((s: any) => s.status === 'Pending').length ? (
                <div className="text-center py-6 text-slate-500 text-xs">No pending shipments ready for dispatch.</div>
              ) : (
                <div className="space-y-3">
                  {shipmentsList.items.filter((s: any) => s.status === 'Pending').map((shipment: any) => (
                    <div key={shipment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-all gap-3">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                          <span>{shipment.trackingNumber || `SHP-${shipment.id.substring(0, 8)}`}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 text-xs">Courier: {shipment.courierName || 'Standard'}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Sales Order ID: {shipment.salesOrderId?.substring(0, 8)} | Items: {shipment.shipmentItems?.length ?? 0}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                          Pending Dispatch
                        </Badge>
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs px-3"
                          disabled={dispatchMutation.isPending && dispatchingId === shipment.id}
                          onClick={() => handleDispatch(shipment.id)}
                        >
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          {dispatchingId === shipment.id ? "Dispatching..." : "Dispatch Shipment"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Inventory Visibility & Dispatches (1 col) */}
        <div className="space-y-6">
          {/* Distribution Inventory Stock Visibility */}
          <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-emerald-600" /> Finished Goods Stock Visibility
                </span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {summary.inventoryVisibility?.length ?? 0} SKUs
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {!summary.inventoryVisibility?.length ? (
                <div className="text-center py-6 text-slate-500 text-xs">No finished goods in stock.</div>
              ) : (
                <div className="space-y-3">
                  {summary.inventoryVisibility.map((inv) => (
                    <div key={inv.productId} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{inv.productName}</span>
                        {inv.isLowStock && (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[9px]">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-center text-[10px]">
                        <div>
                          <span className="text-slate-400 block">On Hand</span>
                          <span className="font-semibold text-slate-800">{inv.quantityOnHand}</span>
                        </div>
                        <div>
                          <span className="text-purple-600 block">Reserved</span>
                          <span className="font-bold text-purple-700">{inv.quantityReserved}</span>
                        </div>
                        <div>
                          <span className="text-emerald-600 block">Available</span>
                          <span className="font-bold text-emerald-700">{inv.quantityAvailable}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Dispatch Activity Log */}
          <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-indigo-600" /> Recent Dispatch Activity
                </span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {summary.recentDispatches?.length ?? 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {!summary.recentDispatches?.length ? (
                <div className="text-center py-6 text-slate-500 text-xs">No recent dispatches recorded.</div>
              ) : (
                <div className="space-y-3">
                  {summary.recentDispatches.map((disp) => (
                    <div key={disp.shipmentId} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{disp.shipmentNumber}</span>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                          {disp.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        SO: {disp.salesOrderNumber} • {disp.distributorName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>Courier: {disp.courierName}</span>
                        <span>{disp.dispatchDate ? new Date(disp.dispatchDate).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Action Shortcuts */}
          <Card className="bg-slate-900 text-white rounded-xl shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-400" /> Distribution Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <Button asChild variant="secondary" size="sm" className="w-full justify-start text-xs bg-white/10 hover:bg-white/20 text-white border-0">
                <Link to="/sales/orders">
                  <PackageCheck className="h-3.5 w-3.5 mr-2 text-teal-400" /> Ready-to-Ship Sales Orders
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="w-full justify-start text-xs bg-white/10 hover:bg-white/20 text-white border-0">
                <Link to="/distribution/shipments">
                  <Truck className="h-3.5 w-3.5 mr-2 text-indigo-400" /> All Outbound Shipments
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="w-full justify-start text-xs bg-white/10 hover:bg-white/20 text-white border-0">
                <Link to="/inventory">
                  <Box className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Check Inventory Ledger
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
