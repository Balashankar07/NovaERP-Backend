import { useState, useMemo, useEffect } from "react";
import { Plus, Eye, ShoppingCart, CheckCircle, FileText, Send, CheckCircle2, Clock, XCircle, FileArchive, RefreshCw } from "lucide-react";
import { purchaseOrdersApi } from "@/api/purchaseOrders.api";
import { PurchaseOrderDto, PurchaseOrderStatus } from "@/types/purchaseOrders.types";
import { useCrudTable } from "@/hooks/use-crud-table";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency, formatDate } from "@/utils/formatters";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PermissionButton } from "@/components/common/permission-button";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";

import { PurchaseOrderFormDialog } from "./components/PurchaseOrderFormDialog";
import { PurchaseOrderDetailsDialog } from "./components/PurchaseOrderDetailsDialog";

const getStatusBadge = (status: string) => {
  switch (status) {
    case PurchaseOrderStatus.Draft:
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> Draft</Badge>;
    case PurchaseOrderStatus.PendingApproval:
      return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</Badge>;
    case PurchaseOrderStatus.Approved:
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
    case PurchaseOrderStatus.Sent:
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1 w-fit"><Send className="w-3 h-3" /> Sent</Badge>;
    case PurchaseOrderStatus.PartiallyReceived:
      return <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1 w-fit"><ShoppingCart className="w-3 h-3" /> Partial</Badge>;
    case PurchaseOrderStatus.Closed:
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 w-fit"><FileArchive className="w-3 h-3" /> Closed</Badge>;
    case PurchaseOrderStatus.Rejected:
    case PurchaseOrderStatus.Cancelled:
      return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> {status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function PurchaseOrdersListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.PurchaseOrders.View");
  const canCreate = hasPermission("Permissions.PurchaseOrders.Create");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderDto | null>(null);
  const [initialPrId, setInitialPrId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prId = params.get('createFromPr');
    if (prId) {
      setInitialPrId(prId);
      setIsFormOpen(true);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
  } = useCrudTable<PurchaseOrderDto>({
    fetchFn: purchaseOrdersApi.getAll,
    defaultSortBy: "OrderDate",
    defaultSortOrder: "desc"
  });

  const handleCreate = () => {
    setSelectedPO(null);
    setIsFormOpen(true);
  };

  const handleView = (po: PurchaseOrderDto) => {
    setSelectedPO(po);
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
            <LoadingView title="Loading Purchase Orders..." />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-64">
            <ErrorView title="Failed to load POs" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-64">
            <EmptyState 
              title="No Purchase Orders found" 
              description={queryParams.search ? "Try adjusting your search query." : "Get started by creating your first purchase order."}
              icon={<ShoppingCart className="w-8 h-8 text-slate-400" />}
              action={canCreate ? { label: "Create PO", onClick: handleCreate } : undefined}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data) {
      return data.items.map((po) => (
        <TableRow key={po.id} className="hover:bg-slate-50/50">
          <TableCell className="pl-4">
            <span className="font-mono font-semibold text-indigo-700">{po.poNumber}</span>
          </TableCell>
          <TableCell>
            <span className="font-medium text-slate-900">{po.supplierName}</span>
          </TableCell>
          <TableCell className="text-slate-600">
            {formatDate(po.orderDate)}
          </TableCell>
          <TableCell className="text-slate-600">
            {formatDate(po.expectedDeliveryDate)}
          </TableCell>
          <TableCell>
            <span className="font-semibold text-slate-900">{formatCurrency(po.totalAmount, po.currency)}</span>
          </TableCell>
          <TableCell>
            {getStatusBadge(po.status)}
          </TableCell>
          <TableCell className="text-right pr-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(po)}
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
    return <ErrorView title="Access Denied" description="You don't have permission to view Purchase Orders." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Orders"
        description="Manage procurement and track orders."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
              <RefreshCw className="w-4 h-4" />
            </Button>
            {canCreate && (
              <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 ml-2">
                <Plus className="w-4 h-4 mr-2" />
                Create PO
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
          searchPlaceholder="Search by PO number or supplier..."
          hasSelections={false}
          selectedCount={0}
        />

        <div className="overflow-x-auto">
          <Table className="min-w-[900px] w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <SortableHeader label="PO Number" field="PoNumber" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px] pl-4" />
                <SortableHeader label="Supplier" field="SupplierName" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[200px]" />
                <SortableHeader label="Order Date" field="OrderDate" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px]" />
                <SortableHeader label="Expected Delivery" field="ExpectedDeliveryDate" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[180px]" />
                <SortableHeader label="Total Amount" field="TotalAmount" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px]" />
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

      <PurchaseOrderFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setInitialPrId(null);
        }}
        onSuccess={handleFormSuccess}
        initialPrId={initialPrId}
      />

      <PurchaseOrderDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        purchaseOrderId={selectedPO?.id || ""}
        onStatusChange={refresh}
      />
    </PageContainer>
  );
}
