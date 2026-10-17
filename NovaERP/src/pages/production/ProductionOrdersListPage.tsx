import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Eye, Search, FileText } from "lucide-react";

import { productionApi } from "@/api/production.api";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { CreateProductionOrderDialog } from "./components/CreateProductionOrderDialog";

import { usePermissions } from "@/hooks/use-permissions";

const getStatusBadge = (status: string | number) => {
  const s = String(status).toLowerCase();
  if (s === 'draft' || s === '0') return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
  if (s === 'released' || s === '1') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Released</Badge>;
  if (s === 'inprogress' || s === '2') return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
  if (s === 'completed' || s === '3') return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
  if (s === 'cancelled' || s === '4') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const getPriorityBadge = (priority: string | number) => {
  const p = String(priority).toLowerCase();
  if (p === 'low' || p === '0') return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Low</Badge>;
  if (p === 'medium' || p === '1') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Medium</Badge>;
  if (p === 'high' || p === '2') return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
  if (p === 'urgent' || p === '3') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold">Urgent</Badge>;
  return <Badge variant="outline">{priority}</Badge>;
};

export const ProductionOrdersListPage = () => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("Permissions.ProductionOrders.Create");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["production-orders", page, searchTerm],
    queryFn: () => productionApi.getAllOrders({ pageNumber: page, pageSize: 20, search: searchTerm }),
  });

  const orders = data?.items || [];

  return (
    <PageContainer>
      <PageHeader
        title="Production Orders"
        description="Manage manufacturing orders and track production execution."
        actions={
          canCreate ? (
            <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          ) : undefined
        }
      />

      <SectionCard className="p-0 border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">All Orders</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search orders..."
                className="pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingView title="Loading orders..." className="py-12" />
          ) : error ? (
            <ErrorView 
              title="Failed to load orders" 
              description={(error as any)?.message || "An unexpected error occurred."} 
              onRetry={() => refetch()} 
              className="py-12" 
            />
          ) : orders.length === 0 ? (
            <EmptyState 
              icon={<FileText className="w-6 h-6 text-slate-400" />} 
              title="No production orders found" 
              description={searchTerm ? "Try adjusting your search query." : "Create your first production order to get started."} 
              action={
                !searchTerm ? {
                  label: "Create Order",
                  onClick: () => setIsCreateOpen(true)
                } : undefined
              }
              className="py-16" 
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-4 font-medium">Order Number</th>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Priority</th>
                    <th className="px-6 py-4 font-medium">Planned Qty</th>
                    <th className="px-6 py-4 font-medium">Started</th>
                    <th className="px-6 py-4 font-medium">Completed</th>
                    <th className="px-6 py-4 font-medium">Rejected</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{order.productionOrderNumber || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]" title={order.productName || order.productId}>
                        {order.productName || order.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(order.priority)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{order.plannedQuantity}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{order.startedQuantity}</td>
                      <td className="px-6 py-4 text-green-600 font-medium whitespace-nowrap">{order.completedQuantity}</td>
                      <td className="px-6 py-4 text-red-600 whitespace-nowrap">{order.rejectedQuantity}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link to={ROUTES.PRODUCTION_ORDER_DETAIL(order.id)}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </SectionCard>

      <CreateProductionOrderDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          refetch();
        }}
      />
    </PageContainer>
  );
};
