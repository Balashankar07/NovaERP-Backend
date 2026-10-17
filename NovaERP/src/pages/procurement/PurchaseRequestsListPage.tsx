import { useState, useMemo } from "react";
import { Plus, Eye, CheckCircle, FileText, XCircle, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { purchaseRequestsApi } from "@/api/purchaseRequests.api";
import { PurchaseRequestDto, PurchaseRequestStatus, PurchaseRequestPriority, PurchaseRequestSource } from "@/types/purchaseRequests.types";
import { useCrudTable } from "@/hooks/use-crud-table";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/utils/formatters";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";

import { PurchaseRequestFormDialog } from "./components/PurchaseRequestFormDialog";
import { PurchaseRequestDetailsDialog } from "./components/PurchaseRequestDetailsDialog";

const getStatusBadge = (status: string) => {
  switch (status) {
    case PurchaseRequestStatus.Draft.toString():
    case 'Draft':
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> Draft</Badge>;
    case PurchaseRequestStatus.PendingApproval.toString():
    case 'PendingApproval':
      return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1 w-fit"><Send className="w-3 h-3" /> Pending</Badge>;
    case PurchaseRequestStatus.Approved.toString():
    case 'Approved':
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
    case PurchaseRequestStatus.Rejected.toString():
    case 'Rejected':
      return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    case PurchaseRequestStatus.PartiallyConverted.toString():
    case 'PartiallyConverted':
      return <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Partial PO</Badge>;
    case PurchaseRequestStatus.FullyConverted.toString():
    case 'FullyConverted':
      return <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Full PO</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPriorityBadge = (priority: number | string) => {
  switch (priority.toString()) {
    case PurchaseRequestPriority.Urgent.toString():
    case 'Urgent':
      return <Badge className="bg-rose-500 hover:bg-rose-600">Urgent</Badge>;
    case PurchaseRequestPriority.High.toString():
    case 'High':
      return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
    case PurchaseRequestPriority.Normal.toString():
    case 'Normal':
      return <Badge variant="secondary">Normal</Badge>;
    case PurchaseRequestPriority.Low.toString():
    case 'Low':
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

export function PurchaseRequestsListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.PurchaseRequests.View");
  const canCreate = hasPermission("Permissions.PurchaseRequests.Create");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequestDto | null>(null);

  const {
    viewState,
    data,
    queryParams,
    searchInput,
    setSearchInput,
    handleSearch,
    toggleSort,
    setPage,
    refresh,
    errorDetails
  } = useCrudTable<PurchaseRequestDto>({
    fetchFn: purchaseRequestsApi.getAll,
    defaultSortBy: "RequestDate",
    defaultSortOrder: "desc"
  });

  const handleCreate = () => {
    setSelectedPR(null);
    setIsFormOpen(true);
  };

  const handleView = (pr: PurchaseRequestDto) => {
    setSelectedPR(pr);
    setIsDetailsOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    refresh();
  };

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-64">
            <LoadingView title="Loading Purchase Requests..." />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      const errorMsg = errorDetails?.message || "Unknown error";
      const status = errorDetails?.statusCode ? ` (HTTP ${errorDetails.statusCode})` : "";
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-64">
            <ErrorView 
              title="Failed to load PRs" 
              description={`${errorMsg}${status}`}
              onRetry={refresh} 
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-64">
            <EmptyState 
              title="No Purchase Requests found" 
              description={queryParams.search ? "Try adjusting your search query." : "Get started by creating your first purchase request."}
              icon={<FileText className="w-8 h-8 text-slate-400" />}
              action={canCreate ? { label: "Create PR", onClick: handleCreate } : undefined}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data) {
      return data.items.map((pr) => (
        <TableRow key={pr.id} className="hover:bg-slate-50/50">
          <TableCell className="pl-4">
            <span className="font-mono font-semibold text-indigo-700">{pr.requestNumber}</span>
          </TableCell>
          <TableCell>
            <span className="font-medium text-slate-900">{pr.requestedBy}</span>
          </TableCell>
          <TableCell className="text-slate-600">
            {formatDate(pr.requestDate)}
          </TableCell>
          <TableCell className="text-slate-600">
            {formatDate(pr.requiredByDate)}
          </TableCell>
          <TableCell>
            {getPriorityBadge(pr.priority)}
          </TableCell>
          <TableCell>
            {getStatusBadge(pr.status.toString())}
          </TableCell>
          <TableCell className="text-right pr-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(pr)}
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
          </TableCell>
        </TableRow>
      ));
    }
    return null;
  }, [viewState, data, queryParams.search, canCreate]);

  if (!canView) {
    return <ErrorView title="Access Denied" description="You don't have permission to view Purchase Requests." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Requests"
        description="Manage component requisitions and approvals."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
              <RefreshCw className="w-4 h-4" />
            </Button>
            {canCreate && (
              <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 ml-2">
                <Plus className="w-4 h-4 mr-2" />
                Create PR
              </Button>
            )}
          </>
        }
      />

      <SectionCard className="p-0 flex flex-col relative">
        <DataTableToolbar 
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search by PR number or requester..."
          hasSelections={false}
          selectedCount={0}
        />

        <div className="overflow-x-auto">
          <Table className="min-w-[900px] w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <SortableHeader label="PR Number" field="RequestNumber" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px] pl-4" />
                <SortableHeader label="Requested By" field="RequestedBy" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px]" />
                <SortableHeader label="Request Date" field="RequestDate" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px]" />
                <SortableHeader label="Required By" field="RequiredByDate" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px]" />
                <SortableHeader label="Priority" field="Priority" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[100px]" />
                <SortableHeader label="Status" field="Status" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px]" />
                <TableHead className="text-right pr-6 w-[120px]">Actions</TableHead>
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

      <PurchaseRequestFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <PurchaseRequestDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        purchaseRequestId={selectedPR?.id || ""}
        onStatusChange={refresh}
      />
    </PageContainer>
  );
}
