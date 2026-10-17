import { useState, useMemo } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { qualityApi } from "@/api/quality.api";
import { QualityInspection } from "@/types/quality.types";
import { ROUTES } from "@/routes";
import { useNavigate } from "react-router-dom";
import { Eye, ShieldCheck, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";

export function QualityInspectionsListPage() {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  
  const canView = hasPermission("Permissions.QualityInspection.View");

  const {
    viewState,
    data,
    queryParams,
    searchInput,
    setSearchInput,
    handleSearch,
    toggleSort,
    setPage,
    refresh
  } = useCrudTable<QualityInspection>({
    fetchFn: qualityApi.getAll,
    defaultSortBy: "InspectionDate",
    defaultSortOrder: "desc"
  });

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <LoadingView title="Loading Inspections..." />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <ErrorView title="Failed to load quality inspections" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <EmptyState 
              title="No inspections found" 
              description={queryParams.search ? "Try adjusting your search query." : "Quality inspections will appear here once production execution completes."}
              icon={<ShieldCheck className="w-8 h-8 text-slate-400" />}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data) {
      return data.items.map((inspection) => (
        <TableRow key={inspection.id} className="hover:bg-slate-50/50">
          <TableCell className="font-medium text-slate-900">{inspection.inspectionNumber}</TableCell>
          <TableCell>{(inspection as any).productName || (inspection as any).productCode || inspection.productId || "—"}</TableCell>
          <TableCell>{(inspection as any).executionNumber || (inspection as any).productionExecutionNumber || inspection.productionExecutionId || "—"}</TableCell>
          <TableCell>
            {inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString() : "—"}
          </TableCell>
          <TableCell className="text-right">{inspection.inspectedQuantity}</TableCell>
          <TableCell>
            <StatusBadge 
              status={inspection.status} 
              customStyles={{
                Draft: "bg-slate-100 text-slate-700",
                InProgress: "bg-blue-100 text-blue-700",
                Passed: "bg-green-100 text-green-700",
                PartiallyPassed: "bg-amber-100 text-amber-700",
                Failed: "bg-rose-100 text-rose-700",
                Cancelled: "bg-slate-100 text-slate-500"
              }}
            />
          </TableCell>
          <TableCell className="text-right pr-6">
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                onClick={() => navigate(ROUTES.QUALITY_DETAIL(inspection.id))}
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ));
    }
    return null;
  }, [viewState, data, queryParams.search, navigate]);

  if (!canView) {
    return <ErrorView title="Access Denied" description="You don't have permission to view quality inspections." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Quality Control"
        description="Manage and track product quality inspections."
        actions={
          <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
            <RefreshCw className="w-4 h-4" />
          </Button>
        }
      />

      <SectionCard className="p-0 flex flex-col relative overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <DataTableToolbar 
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={handleSearch}
            searchPlaceholder="Search inspections..."
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px] w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <SortableHeader
                  field="InspectionNumber"
                  label="Inspection #"
                  currentSortBy={queryParams.sortBy}
                  currentSortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                  className="w-[150px] pl-4"
                />
                <TableHead className="w-[150px]">Product</TableHead>
                <TableHead className="w-[150px]">Execution</TableHead>
                <SortableHeader
                  field="InspectionDate"
                  label="Date"
                  currentSortBy={queryParams.sortBy}
                  currentSortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                  className="w-[120px]"
                />
                <TableHead className="w-[120px] text-right">Inspected Qty</TableHead>
                <SortableHeader
                  field="Status"
                  label="Status"
                  currentSortBy={queryParams.sortBy}
                  currentSortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                  className="w-[120px]"
                />
                <TableHead className="text-right pr-6 w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderedRows}
            </TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination 
              data={data} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
}