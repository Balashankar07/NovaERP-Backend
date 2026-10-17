import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { salesApi, salesOrdersApi } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import { 
  ShoppingBag, Clock, CheckCircle2, Lock, Truck, CheckCircle, 
  TrendingUp, RefreshCw, Plus, Users, ArrowUpRight, Box, 
  AlertTriangle, FileText, PackageCheck, Activity
} from "lucide-react";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { formatCurrency, formatNumber, formatDate } from "@/utils/formatters";
import { ROUTES } from "@/routes";

export function SalesDashboardPage() {
  const queryClient = useQueryClient();

  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ["sales", "summary"],
    queryFn: () => salesApi.getSummary(),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["sales-orders", "recent"],
    queryFn: () => salesOrdersApi.getAll({ pageNumber: 1, pageSize: 10 }),
    staleTime: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => salesOrdersApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    }
  });

  const reserveMutation = useMutation({
    mutationFn: (id: string) => salesOrdersApi.reserve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    }
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["sales", "summary"] });
    queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingView title="Loading Sales & Fulfillment Control Center..." />
      </PageContainer>
    );
  }

  if (isError || !summary) {
    return (
      <PageContainer>
        <ErrorView message="Failed to load Sales Control Center data." onRetry={handleRefresh} />
      </PageContainer>
    );
  }

  // Safely extract values from API summary object (handling all backend DTO shape variants)
  const rawSummary = summary as any;
  const draftOrders = summary.draftOrders ?? rawSummary.draftOrdersCount ?? 0;
  const pendingApprovalOrders = summary.pendingApprovalOrders ?? rawSummary.pendingApprovalCount ?? 0;
  const approvedOrders = summary.approvedOrders ?? rawSummary.approvedOrdersCount ?? 0;
  const reservedOrders = summary.reservedOrders ?? rawSummary.reservedOrdersCount ?? 0;
  const readyToShipOrders = summary.readyToShipOrders ?? rawSummary.readyToShipCount ?? 0;
  const partiallyShippedOrders = summary.partiallyShippedOrders ?? rawSummary.partiallyShippedCount ?? 0;
  const completedOrders = summary.completedOrders ?? rawSummary.completedOrdersCount ?? 0;
  const totalOrders = summary.totalOrders ?? rawSummary.openOrdersCount ?? 0;

  const finishedGoodsAvailability = summary.finishedGoodsAvailability || [];
  const availableFinishedGoodsCount = summary.availableFinishedGoodsCount ?? finishedGoodsAvailability.length;
  const availableFinishedGoodsQuantity = summary.availableFinishedGoodsQuantity ?? 0;

  const totalSalesValue = summary.totalSalesValue ?? 0;
  const reservedFinishedGoodsValue = summary.reservedFinishedGoodsValue ?? rawSummary.openSalesValue ?? (
    finishedGoodsAvailability.reduce((acc: number, item: any) => {
      const reserved = item.reservedQuantity ?? item.quantityReserved ?? 0;
      const price = item.unitPrice ?? 0;
      return acc + (reserved * price);
    }, 0)
  );

  const activeReservations = summary.activeReservations || [];
  const topDistributors = summary.topDistributors || [];
  const attentionItems = summary.attentionItems || [];

  const getStatusBadge = (status: string | number) => {
    const statusStr = String(status);
    switch (statusStr) {
      case "Draft":
      case "1":
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Draft</Badge>;
      case "PendingApproval":
      case "2":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Approval</Badge>;
      case "Approved":
      case "3":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>;
      case "Reserved":
      case "4":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Reserved</Badge>;
      case "ReadyToShip":
      case "5":
        return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">Ready to Ship</Badge>;
      case "PartiallyShipped":
      case "6":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Partially Shipped</Badge>;
      case "Completed":
      case "7":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
      case "Cancelled":
      case "8":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{statusStr}</Badge>;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Sales & Fulfillment Control Center"
        description="Monitor B2B distributor demand, stock reservations, finished goods availability, and fulfillment performance."
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Link to="/sales/orders">
              <Plus className="h-4 w-4 mr-2" /> New Sales Order
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* 8 Primary Operational KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Draft Orders</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{formatNumber(draftOrders)}</div>
            <p className="text-xs text-slate-500 mt-1">Pending submission by sales</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-amber-200/70 shadow-sm rounded-xl hover:border-amber-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600">{formatNumber(pendingApprovalOrders)}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting manager sign-off</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-blue-200/70 shadow-sm rounded-xl hover:border-blue-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-700">Approved Orders</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-600">{formatNumber(approvedOrders)}</div>
            <p className="text-xs text-slate-500 mt-1">Ready for stock reservation</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-purple-200/70 shadow-sm rounded-xl hover:border-purple-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-700">Reserved Orders</CardTitle>
            <Lock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-purple-600">{formatNumber(reservedOrders)}</div>
            <p className="text-xs text-slate-500 mt-1">Stock committed & held</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-teal-200/70 shadow-sm rounded-xl hover:border-teal-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-teal-700">Ready To Ship</CardTitle>
            <PackageCheck className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-teal-600">{formatNumber(readyToShipOrders)}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting dispatch execution</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-indigo-200/70 shadow-sm rounded-xl hover:border-indigo-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Partially Shipped</CardTitle>
            <Truck className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-indigo-600">{formatNumber(partiallyShippedOrders)}</div>
            <p className="text-xs text-slate-500 mt-1">Partial deliveries dispatched</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200/70 shadow-sm rounded-xl hover:border-emerald-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600">{formatNumber(completedOrders)}</div>
            <p className="text-xs text-slate-500 mt-1">Fully fulfilled & delivered</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available FG Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{formatNumber(availableFinishedGoodsQuantity)} units</div>
            <p className="text-xs text-slate-500 mt-1">{formatNumber(availableFinishedGoodsCount)} distinct SKUs ready</p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Attention Alerts & Sales Financial Summary */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-md border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-indigo-400" />
                Sales & Revenue Operational Performance
              </CardTitle>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30">
                {formatNumber(totalOrders)} Total Sales Orders
              </Badge>
            </div>
            <CardDescription className="text-slate-300 text-xs">
              Live valuation of booked sales pipeline, active reservations, and uncommitted finished goods inventory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 pt-2">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs font-medium text-slate-400">Total Booked Sales Value</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(totalSalesValue)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Across all order states</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs font-medium text-purple-300">Reserved Inventory Value</p>
                <p className="text-2xl font-bold text-purple-200 mt-1">
                  {formatCurrency(reservedFinishedGoodsValue)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Locked against active SOs</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs font-medium text-emerald-300">Available Stock Items</p>
                <p className="text-2xl font-bold text-emerald-200 mt-1">
                  {formatNumber(availableFinishedGoodsCount)} SKUs
                </p>
                <p className="text-[10px] text-slate-400 mt-1">{formatNumber(availableFinishedGoodsQuantity)} total unreserved units</p>
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
                {attentionItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {!attentionItems.length ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                All sales orders are flowing smoothly.
              </div>
            ) : (
              <div className="space-y-3">
                {attentionItems.map((item: any) => (
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
        {/* Left Column: Actionable Order Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Queue: Orders Pending Approval or Reservation */}
          <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Actionable Sales Orders Queue</span>
                <Link to="/sales/orders" className="text-xs font-normal text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View All Orders <ArrowUpRight className="h-3 w-3" />
                </Link>
              </CardTitle>
              <CardDescription className="text-xs">
                Approve submitted orders or assign inventory stock reservations to approved orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!recentOrders?.items?.length ? (
                <div className="text-center py-8 text-slate-500 text-sm">No recent sales orders.</div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.items.map((so: any) => (
                    <div key={so.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 hover:bg-slate-50 transition-all gap-3">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                          <span>{so.orderNumber}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-700 font-medium">{so.distributorName || "B2B Distributor"}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span>Amount: <strong className="text-slate-700">{formatCurrency(so.totalAmount, so.currency)}</strong></span>
                          <span>•</span>
                          <span>Date: {formatDate(so.orderDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {getStatusBadge(so.status)}
                        {(so.status === "Draft" || so.status === "PendingApproval" || so.status === 1 || so.status === 2) && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs px-3"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(so.id)}
                          >
                            Approve
                          </Button>
                        )}
                        {(so.status === "Approved" || so.status === 3) && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs px-3"
                            disabled={reserveMutation.isPending}
                            onClick={() => reserveMutation.mutate(so.id)}
                          >
                            Reserve Stock
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Finished Goods Availability */}
          <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-emerald-600" /> Finished Goods Stock Availability
                </span>
                <Badge variant="outline" className="text-xs font-normal">
                  {finishedGoodsAvailability.length} Products
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time breakdown of On-Hand, Reserved, and Unrestricted Available stock for fulfillment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!finishedGoodsAvailability.length ? (
                <div className="text-center py-8 text-slate-500 text-xs">No finished goods found in stock.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Product / SKU</th>
                        <th className="p-3 text-right">On Hand</th>
                        <th className="p-3 text-right text-purple-700">Reserved</th>
                        <th className="p-3 text-right text-emerald-700">Available</th>
                        <th className="p-3 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finishedGoodsAvailability.map((fg: any) => {
                        const name = fg.productName || fg.name || 'Product';
                        const sku = fg.sku || fg.productCode || 'N/A';
                        const onHand = fg.onHandQuantity ?? fg.quantityOnHand ?? 0;
                        const reserved = fg.reservedQuantity ?? fg.quantityReserved ?? 0;
                        const available = fg.availableQuantity ?? fg.quantityAvailable ?? 0;
                        const price = fg.unitPrice ?? 0;

                        return (
                          <tr key={fg.productId || fg.id || name} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-medium text-slate-900">
                              <div>{name}</div>
                              <div className="text-[10px] text-slate-500 font-normal">SKU: {sku}</div>
                            </td>
                            <td className="p-3 text-right font-medium text-slate-800">{formatNumber(onHand)}</td>
                            <td className="p-3 text-right font-semibold text-purple-600">{formatNumber(reserved)}</td>
                            <td className="p-3 text-right font-bold text-emerald-600">{formatNumber(available)}</td>
                            <td className="p-3 text-right text-slate-700">{formatCurrency(price)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Reservations & Distributors (1 col) */}
        <div className="space-y-6">
          {/* Active Inventory Reservations */}
          <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-600" /> Active Stock Reservations
                </span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {activeReservations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {!activeReservations.length ? (
                <div className="text-center py-6 text-slate-500 text-xs">No active reservations found.</div>
              ) : (
                <div className="space-y-3">
                  {activeReservations.slice(0, 5).map((res: any) => {
                    const resId = res.reservationId || res.id;
                    const orderNum = res.salesOrderNumber || res.orderNumber || 'SO';
                    const qtyReserved = res.quantityReserved ?? res.reservedQuantity ?? 0;
                    const qtyConsumed = res.quantityConsumed ?? res.consumedQuantity ?? 0;
                    const distName = res.distributorName || 'B2B Customer';
                    const prodName = res.productName || 'Product';

                    return (
                      <div key={resId} className="p-3 rounded-lg border border-purple-100 bg-purple-50/30 text-xs">
                        <div className="flex items-center justify-between font-semibold text-purple-950">
                          <span>{orderNum}</span>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 text-[10px] border-purple-200">
                            {formatNumber(qtyReserved)} units reserved
                          </Badge>
                        </div>
                        <div className="text-[11px] text-purple-900 mt-1 font-medium">{distName}</div>
                        <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                          <span>Product: {prodName}</span>
                          <span>Consumed: {formatNumber(qtyConsumed)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top B2B Distributors Activity */}
          <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" /> Top B2B Distributors
                </span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {topDistributors.length} Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {!topDistributors.length ? (
                <div className="text-center py-6 text-slate-500 text-xs">No distributor activity recorded.</div>
              ) : (
                <div className="space-y-3">
                  {topDistributors.map((dist: any) => (
                    <div key={dist.distributorId || dist.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{dist.companyName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Contact: {dist.contactPerson || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-indigo-600">{formatCurrency(dist.totalOrderValue)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{formatNumber(dist.totalOrders)} Orders</div>
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
                <Activity className="h-4 w-4 text-indigo-400" /> Sales Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <Button asChild variant="secondary" size="sm" className="w-full justify-start text-xs bg-white/10 hover:bg-white/20 text-white border-0">
                <Link to="/sales/orders">
                  <ShoppingBag className="h-3.5 w-3.5 mr-2 text-indigo-400" /> Manage All Sales Orders
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="w-full justify-start text-xs bg-white/10 hover:bg-white/20 text-white border-0">
                <Link to={ROUTES.DISTRIBUTORS}>
                  <Users className="h-3.5 w-3.5 mr-2 text-teal-400" /> B2B Distributor Accounts
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
