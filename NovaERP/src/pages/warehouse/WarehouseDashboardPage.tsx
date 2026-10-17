import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi, goodsReceiptsApi, shipmentsApi, purchaseOrdersApi } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { Warehouse, Package, AlertTriangle, ArrowRightLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { LoadingView } from "@/components/ui/state-views";

export function WarehouseDashboardPage() {
  const queryClient = useQueryClient();

  const { data: invSummary, isLoading: isInvLoading, isError: isInvError } = useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => inventoryApi.getSummary(),
    staleTime: 30000
  });

  const { data: recentGRNs, isLoading: isGRNLoading, isError: isGRNError } = useQuery({
    queryKey: ["goods-receipts", "recent"],
    queryFn: () => goodsReceiptsApi.getAll({ pageNumber: 1, pageSize: 5 }),
    staleTime: 30000,
    retry: 1
  });

  const { data: recentShipments, isLoading: isShipLoading, isError: isShipError } = useQuery({
    queryKey: ["shipments", "recent"],
    queryFn: () => shipmentsApi.getAll({ pageNumber: 1, pageSize: 5 }),
    staleTime: 30000,
    retry: 1
  });

  const { data: stockMovements, isLoading: isMovLoading, isError: isMovError } = useQuery({
    queryKey: ["inventory", "transactions"],
    queryFn: () => inventoryApi.getAllTransactions({ pageNumber: 1, pageSize: 5 }),
    staleTime: 30000,
    retry: 1
  });

  const { data: purchaseOrdersData, isLoading: isPOLoading, isError: isPOError } = useQuery({
    queryKey: ["purchase-orders", "incoming"],
    // Fetch a larger batch so we can filter pending ones client-side for the dashboard preview
    queryFn: () => purchaseOrdersApi.getAll({ pageNumber: 1, pageSize: 50, sortBy: 'OrderDate', sortOrder: 'desc' }),
    staleTime: 30000,
    retry: 1
  });

  const incomingPOs = purchaseOrdersData?.items?.filter((po: any) => po.status === 'Sent' || po.status === 'PartiallyReceived') || [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
    queryClient.invalidateQueries({ queryKey: ["shipments"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Warehouse & Inventory Control Center"
        description="Monitor physical stock on hand, reserved stock, available quantity, goods receipts, and shipment dispatches."
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Stock On Hand</CardTitle>
            <Package className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {isInvLoading ? (
              <div className="h-8 bg-slate-100 animate-pulse rounded" />
            ) : isInvError ? (
              <p className="text-xs text-slate-400">Unavailable</p>
            ) : (
              <div>
                <div className="text-2xl font-bold text-slate-900">{invSummary?.totalOnHandQuantity?.toLocaleString() ?? 0}</div>
                <p className="text-xs text-slate-500 mt-1">Across {invSummary?.warehouseCount ?? 0} warehouses</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Reserved Quantity</CardTitle>
            <Warehouse className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {isInvLoading ? (
              <div className="h-8 bg-slate-100 animate-pulse rounded" />
            ) : isInvError ? (
              <p className="text-xs text-slate-400">Unavailable</p>
            ) : (
              <div>
                <div className="text-2xl font-bold text-amber-600">{invSummary?.totalReservedQuantity?.toLocaleString() ?? 0}</div>
                <p className="text-xs text-slate-500 mt-1">Committed to active Sales Orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Available Quantity</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {isInvLoading ? (
              <div className="h-8 bg-slate-100 animate-pulse rounded" />
            ) : isInvError ? (
              <p className="text-xs text-slate-400">Unavailable</p>
            ) : (
              <div>
                <div className="text-2xl font-bold text-emerald-600">{invSummary?.totalAvailableQuantity?.toLocaleString() ?? 0}</div>
                <p className="text-xs text-slate-500 mt-1">Unrestricted & fulfillable</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            {isInvLoading ? (
              <div className="h-8 bg-slate-100 animate-pulse rounded" />
            ) : isInvError ? (
              <p className="text-xs text-slate-400">Unavailable</p>
            ) : (
              <div>
                <div className="text-2xl font-bold text-rose-600">{invSummary?.lowStockItems ?? 0}</div>
                <p className="text-xs text-slate-500 mt-1">Below minimum threshold</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Incoming Shipments (Purchase Orders) */}
        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" /> Incoming Shipments
              </span>
              <Badge variant="secondary" className="font-normal text-xs">{incomingPOs.length} pending</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Approved Purchase Orders waiting for receipt</CardDescription>
          </CardHeader>
          <CardContent>
            {isPOLoading ? (
              <LoadingView title="Loading incoming shipments..." />
            ) : isPOError || !incomingPOs.length ? (
              <div className="text-center py-8 text-slate-500 text-sm">No incoming shipments at this time.</div>
            ) : (
              <div className="space-y-3">
                {incomingPOs.slice(0, 5).map((po: any) => (
                  <div key={po.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{po.poNumber}</div>
                      <div className="text-xs text-slate-500">Supplier: {po.supplierName} • Exp: {new Date(po.expectedDeliveryDate).toLocaleDateString()}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-50">
                      {po.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Movements / Transactions */}
        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-indigo-600" /> Stock Movements
              </span>
              <Badge variant="secondary" className="font-normal text-xs">{stockMovements?.totalCount ?? 0} total</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Recent physical inventory ledger movements</CardDescription>
          </CardHeader>
          <CardContent>
            {isMovLoading ? (
              <LoadingView title="Loading stock movements..." />
            ) : isMovError || !stockMovements?.items?.length ? (
              <div className="text-center py-8 text-slate-500 text-sm">No recent stock movements recorded.</div>
            ) : (
              <div className="space-y-3">
                {stockMovements.items.slice(0, 5).map((mov) => (
                  <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{mov.productName || mov.productCode}</div>
                      <div className="text-xs text-slate-500">Warehouse: {mov.warehouseName || 'Main'}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {mov.transactionType}
                      </Badge>
                      <div className="text-xs font-semibold text-slate-700 mt-0.5">
                        {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Goods Receipts */}
        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span>Goods Receipts (GRN)</span>
              <Badge variant="secondary" className="font-normal text-xs">{recentGRNs?.totalCount ?? 0} total</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Inbound goods receiving from Purchase Orders</CardDescription>
          </CardHeader>
          <CardContent>
            {isGRNLoading ? (
              <LoadingView title="Loading GRNs..." />
            ) : isGRNError || !recentGRNs?.items?.length ? (
              <div className="text-center py-8 text-slate-500 text-sm">No recent goods receipts found.</div>
            ) : (
              <div className="space-y-3">
                {recentGRNs.items.slice(0, 5).map((grn: any) => (
                  <div key={grn.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{grn.receiptNumber || grn.grnNumber || grn.id.substring(0, 8)}</div>
                      <div className="text-xs text-slate-500">PO: {grn.purchaseOrderNumber || "PO"} • Supplier: {grn.supplierName || "Vendor"}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {grn.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Shipments */}
        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span>Outgoing Shipments</span>
              <Badge variant="secondary" className="font-normal text-xs">{recentShipments?.totalCount ?? 0} total</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Outbound distribution and fulfillment dispatches</CardDescription>
          </CardHeader>
          <CardContent>
            {isShipLoading ? (
              <LoadingView title="Loading shipments..." />
            ) : isShipError || !recentShipments?.items?.length ? (
              <div className="text-center py-8 text-slate-500 text-sm">No recent shipments recorded.</div>
            ) : (
              <div className="space-y-3">
                {recentShipments.items.slice(0, 5).map((shipment: any) => (
                  <div key={shipment.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{shipment.shipmentNumber || shipment.id.substring(0, 8)}</div>
                      <div className="text-xs text-slate-500">SO: {shipment.salesOrderNumber || "Sales Order"} • Carrier: {shipment.carrier || "Standard"}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {shipment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
