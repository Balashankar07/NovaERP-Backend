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
import { CreateProductionPlanDialog } from "./components/CreateProductionPlanDialog";

import { usePermissions } from "@/hooks/use-permissions";

// Maps the backend ProductionPlanStatus string values (via .ToString()):
// Draft=1 → "Draft", Released=2 → "Released", Completed=3 → "Completed", Cancelled=4 → "Cancelled"
const getStatusBadge = (status: string | number) => {
  const s = String(status).toLowerCase();
  if (s === 'draft' || s === '1') return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
  if (s === 'released' || s === '2') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Released</Badge>;
  if (s === 'completed' || s === '3') return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
  if (s === 'cancelled' || s === '4') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

export const ProductionPlansListPage = () => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("Permissions.ProductionPlans.Create");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [page, _setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["production-plans", page, searchTerm],
    queryFn: () => productionApi.getAllPlans({ pageNumber: page, pageSize: 10, search: searchTerm }),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Production Plans"
        description="Manage production plans, requirements, and releases."
        actions={
          canCreate ? (
            <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          ) : undefined
        }
      />

      <SectionCard className="p-0 border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">All Plans</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search plans..."
                className="pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingView title="Loading plans..." className="py-12" />
          ) : error ? (
            <ErrorView 
              title="Failed to load plans" 
              description={(error as any)?.message || "An unexpected error occurred."} 
              onRetry={() => refetch()} 
              className="py-12" 
            />
          ) : data?.items?.length === 0 ? (
            <EmptyState 
              icon={<FileText className="w-6 h-6 text-slate-400" />} 
              title="No production plans found" 
              description={searchTerm ? "Try adjusting your search query." : "Create your first production plan to get started."} 
              action={
                !searchTerm ? {
                  label: "Create Plan",
                  onClick: () => setIsCreateOpen(true)
                } : undefined
              }
              className="py-16" 
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Plan Number</th>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Quantity</th>
                    <th className="px-6 py-4 font-medium">Start Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.items?.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{plan.planNumber || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{plan.productName || plan.productId}</td>
                      <td className="px-6 py-4 text-slate-600">{plan.plannedQuantity}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {plan.plannedStartDate ? new Date(plan.plannedStartDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(plan.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={ROUTES.PRODUCTION_PLAN_DETAIL(plan.id)}>
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

      <CreateProductionPlanDialog
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
