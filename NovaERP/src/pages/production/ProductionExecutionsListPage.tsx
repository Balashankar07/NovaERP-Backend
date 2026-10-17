import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Search, FileText } from "lucide-react";

import { productionApi } from "@/api/production.api";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { formatDateTime } from "@/utils/formatters";

const getStatusBadge = (status: string | number) => {
  const s = String(status).toLowerCase();
  if (s === 'draft' || s === '0') return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
  if (s === 'started' || s === '1') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Started</Badge>;
  if (s === 'completed' || s === '2') return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
  if (s === 'cancelled' || s === '3') return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Cancelled</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

export const ProductionExecutionsListPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["production-executions", page, searchTerm],
    queryFn: () => productionApi.getAllExecutions({ pageNumber: page, pageSize: 20, search: searchTerm }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["production-orders-lookup"],
    queryFn: () => productionApi.getAllOrders({ pageSize: 100 }),
    staleTime: 60000,
  });

  const ordersMap = useMemo(() => {
    const map = new Map<string, any>();
    if (ordersData?.items) {
      ordersData.items.forEach((o) => map.set(o.id, o));
    }
    return map;
  }, [ordersData]);

  const executions = data?.items || [];

  return (
    <PageContainer>
      <PageHeader
        title="Production Executions"
        description="Track active and completed manufacturing executions across all production orders."
      />

      <SectionCard className="p-0 border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">All Shop Floor Executions</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search executions..."
                className="pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingView title="Loading executions..." className="py-12" />
          ) : error ? (
            <ErrorView 
              title="Failed to load executions" 
              description={(error as any)?.message || "An unexpected error occurred."} 
              onRetry={() => refetch()} 
              className="py-12" 
            />
          ) : executions.length === 0 ? (
            <EmptyState 
              icon={<FileText className="w-6 h-6 text-slate-400" />} 
              title="No production executions found" 
              description={searchTerm ? "Try adjusting your search query." : "Start an execution from a production order to see it here."}
              className="py-16" 
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-4 font-medium">Execution #</th>
                    <th className="px-6 py-4 font-medium">Production Order</th>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Started At</th>
                    <th className="px-6 py-4 font-medium">Completed At</th>
                    <th className="px-6 py-4 font-medium text-right">Produced Qty</th>
                    <th className="px-6 py-4 font-medium text-right">Rejected Qty</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {executions.map((execution) => {
                    const order = ordersMap.get(execution.productionOrderId);
                    const orderNum = order?.productionOrderNumber || execution.productionOrderId;
                    const prodName = order?.productName || "-";

                    return (
                      <tr key={execution.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                          <Link to={ROUTES.PRODUCTION_EXECUTION_DETAIL(execution.id)} className="text-indigo-600 hover:underline">
                            {execution.executionNumber || execution.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                          {execution.productionOrderId ? (
                            <Link to={ROUTES.PRODUCTION_ORDER_DETAIL(execution.productionOrderId)} className="text-slate-800 hover:text-indigo-600 hover:underline">
                              {orderNum}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap max-w-[200px] truncate" title={prodName}>
                          {prodName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(execution.status)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {execution.startedAt ? formatDateTime(execution.startedAt) : '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {execution.completedAt ? formatDateTime(execution.completedAt) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-semibold whitespace-nowrap">
                          {execution.producedQuantity}
                        </td>
                        <td className="px-6 py-4 text-right text-rose-600 font-semibold whitespace-nowrap">
                          {execution.rejectedQuantity}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link to={ROUTES.PRODUCTION_EXECUTION_DETAIL(execution.id)}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View details</span>
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </SectionCard>
    </PageContainer>
  );
};


