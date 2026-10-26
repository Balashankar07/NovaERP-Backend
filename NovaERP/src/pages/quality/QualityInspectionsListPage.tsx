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
    defaultSortBy: "CreatedAt",
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
              description={queryParams.search ? "Try adjusting your search query." : "Quality inspections will appear here when goods receipts arrive or production completes."}
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
          <TableCell>
            <div className="font-medium text-slate-900">{(inspection as any).productName || (inspection as any).productCode || inspection.productId || "—"}</div>
            {(inspection as any).productCode && (inspection as any).productName && (
              <div className="text-xs text-slate-500 font-mono">{(inspection as any).productCode}</div>
            )}
          </TableCell>
          <TableCell>
            {(inspection as any).goodsReceiptNumber ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                GRN: {(inspection as any).goodsReceiptNumber}
              </span>
            ) : (inspection as any).productionExecutionNumber ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                WO: {(inspection as any).productionExecutionNumber}
              </span>
            ) : (
              <span className="text-slate-400 text-xs">—</span>
            )}
          </TableCell>
          <TableCell>
            {inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString() : "Pending"}
          </TableCell>
          <TableCell className="text-right">
            <span className="font-medium">{inspection.inspectedQuantity}</span>
            {inspection.status === 'Passed' && (
              <span className="block text-xs text-emerald-600 font-medium">✓ {inspection.passedQuantity} passed</span>
            )}
            {inspection.status === 'PartiallyPassed' && (
              <span className="block text-xs text-amber-600 font-medium">{inspection.passedQuantity} passed / {inspection.failedQuantity} failed</span>
            )}
            {inspection.status === 'Failed' && (
              <span className="block text-xs text-rose-600 font-medium">✕ {inspection.failedQuantity} rejected</span>
            )}
          </TableCell>
          <TableCell>
            <StatusBadge 
              status={
                inspection.status === 'Draft' ? 'Awaiting QC' :
                inspection.status === 'InProgress' ? 'In Progress' :
                inspection.status === 'Passed' ? 'Accepted' :
                inspection.status === 'PartiallyPassed' ? 'Partially Accepted' :
                inspection.status === 'Failed' ? 'Rejected / Blocked' :
                inspection.status
              } 
              customStyles={{
                'Awaiting QC': "bg-slate-100 text-slate-700 border-slate-200",
                'In Progress': "bg-blue-100 text-blue-700 border-blue-200",
                'Accepted': "bg-green-100 text-green-700 border-green-200",
                'Partially Accepted': "bg-amber-100 text-amber-700 border-amber-200",
                'Rejected / Blocked': "bg-rose-100 text-rose-700 border-rose-200",
                Draft: "bg-slate-100 text-slate-700 border-slate-200",
                InProgress: "bg-blue-100 text-blue-700 border-blue-200",
                Passed: "bg-green-100 text-green-700 border-green-200",
                PartiallyPassed: "bg-amber-100 text-amber-700 border-amber-200",
                Failed: "bg-rose-100 text-rose-700 border-rose-200",
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
        description="Manage and track raw material and production quality inspections."
        actions={
          <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
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
                <TableHead className="w-[180px]">Product</TableHead>
                <TableHead className="w-[140px]">Origin / Ref</TableHead>
                <SortableHeader
                  field="InspectionDate"
                  label="Date"
                  currentSortBy={queryParams.sortBy}
                  currentSortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                  className="w-[110px]"
                />
                <TableHead className="w-[140px] text-right">Quantities</TableHead>
                <SortableHeader
                  field="Status"
                  label="Status"
                  currentSortBy={queryParams.sortBy}
                  currentSortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                  className="w-[140px]"
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
