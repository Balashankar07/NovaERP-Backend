import { useState, useMemo } from "react";
import { Plus, Eye, ShoppingCart, CheckCircle, FileText, Clock, XCircle, FileArchive, RefreshCw, Box, AlertCircle } from "lucide-react";
import { salesApi } from "@/api/sales.api";
import { SalesOrderDto, SalesOrderStatus } from "@/types/sales.types";
import { useCrudTable } from "@/hooks/use-crud-table";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useNavigate } from "react-router-dom";

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
import { PermissionButton } from "@/components/common/permission-button";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";

import { SalesOrderFormDialog } from "./components/SalesOrderFormDialog";

const getStatusBadge = (status: string | number) => {
  const statusStr = String(status);
  switch (statusStr) {
    case SalesOrderStatus.Draft:
    case "1":
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> Draft</Badge>;
    case SalesOrderStatus.PendingApproval:
    case "2":
      return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending Approval</Badge>;
    case SalesOrderStatus.Approved:
    case "3":
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
    case SalesOrderStatus.Reserved:
    case "4":
      return <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 flex items-center gap-1 w-fit"><Box className="w-3 h-3" /> Reserved</Badge>;
    case SalesOrderStatus.ReadyToShip:
    case "5":
      return <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Ready To Ship</Badge>;
    case SalesOrderStatus.PartiallyShipped:
    case "6":
      return <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1 w-fit"><ShoppingCart className="w-3 h-3" /> Partial</Badge>;
    case SalesOrderStatus.Completed:
    case "7":
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 w-fit"><FileArchive className="w-3 h-3" /> Completed</Badge>;
    case SalesOrderStatus.Cancelled:
    case "8":
    case SalesOrderStatus.Rejected:
    case "9":
      return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> {statusStr}</Badge>;
    default:
      return <Badge variant="outline">{statusStr}</Badge>;
  }
};

export function SalesOrdersListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.SalesOrders.View");
  const canCreate = hasPermission("Permissions.SalesOrders.Create");
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);

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
  } = useCrudTable<SalesOrderDto>({
    fetchFn: salesApi.getSalesOrders,
    defaultSortBy: "CreatedAt",
    defaultSortOrder: "desc",
  });

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-64">
            <LoadingView title="Loading Sales Orders..." />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-64">
            <ErrorView title="Failed to load sales orders" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && (!data?.items || data.items.length === 0))) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-64">
            <EmptyState 
              title="No sales orders found" 
              description={queryParams.search ? "Try adjusting your search filters." : "Create your first sales order to get started."} 
              icon={<ShoppingCart className="w-8 h-8 text-slate-400" />}
              action={
                canCreate && !queryParams.search ? {
                  label: "New Order",
                  onClick: () => setIsFormOpen(true),
                } : undefined
              }
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data?.items) {
      return data.items.map((order) => (
        <TableRow key={order.id} className="hover:bg-slate-50/50">
          <TableCell className="font-medium font-mono text-indigo-700 pl-4">{order.orderNumber}</TableCell>
          <TableCell className="font-medium text-slate-900">{order.distributorName || "B2B Customer"}</TableCell>
          <TableCell className="text-slate-600">{formatDate(order.orderDate)}</TableCell>
          <TableCell>{getStatusBadge(order.status)}</TableCell>
          <TableCell className="text-right font-semibold text-slate-900">
            {formatCurrency(order.totalAmount, order.currency)}
          </TableCell>
          <TableCell className="text-right pr-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/orders/${order.id}`)}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          </TableCell>
        </TableRow>
      ));
    }

    return null;
  }, [viewState, data, queryParams.search, canCreate, navigate, refresh]);

  if (!canView) {
    return <ErrorView title="Access Denied" message="You do not have permission to view sales orders." />;
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Sales Orders" 
        description="Manage B2B customer sales orders, stock reservations, and fulfillment."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refresh} className="mr-2">
              <RefreshCw className={`w-4 h-4 mr-2 ${viewState === 'loading' ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <PermissionButton
              permission="Permissions.SalesOrders.Create"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </PermissionButton>
          </>
        }
      />

      <SectionCard className="p-0 flex flex-col relative">
        <DataTableToolbar 
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search by order number or customer..."
          hasSelections={false}
          selectedCount={0}
        />

        <div className="overflow-x-auto">
          <Table className="min-w-[900px] w-full">
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <SortableHeader field="OrderNumber" label="Order Number" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[180px] pl-4" />
                <SortableHeader field="DistributorName" label="Customer" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[220px]" />
                <SortableHeader field="OrderDate" label="Date" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px]" />
                <SortableHeader field="Status" label="Status" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[180px]" />
                <TableHead className="text-right w-[150px]">Total Amount</TableHead>
                <TableHead className="text-right w-[120px] pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderedRows}
            </TableBody>
          </Table>
        </div>

        {data && data.items && data.items.length > 0 && (
          <Pagination
            data={data}
            onPageChange={setPage}
          />
        )}
      </SectionCard>

      {isFormOpen && (
        <SalesOrderFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={() => {
            setIsFormOpen(false);
            refresh();
          }}
        />
      )}
    </PageContainer>
  );
}
