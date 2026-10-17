import { useState } from "react";
import { Plus, Eye, CheckCircle, FileText, XCircle, RefreshCw, Archive } from "lucide-react";
import { goodsReceiptsApi } from "@/api/goodsReceipts.api";
import { GoodsReceiptDto, GoodsReceiptStatus } from "@/types/goodsReceipts.types";
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
import { PermissionButton } from "@/components/common/permission-button";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";

import { GoodsReceiptFormDialog } from "./components/GoodsReceiptFormDialog";
import { GoodsReceiptDetailsDialog } from "./components/GoodsReceiptDetailsDialog";

const getStatusBadge = (status: string) => {
  switch (status) {
    case GoodsReceiptStatus.Draft:
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> Draft</Badge>;
    case GoodsReceiptStatus.Completed:
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
    case GoodsReceiptStatus.Cancelled:
      return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function GoodsReceiptsListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.GoodsReceipts.View");
  const canCreate = hasPermission("Permissions.GoodsReceipts.Create");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GoodsReceiptDto | null>(null);

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
  } = useCrudTable<GoodsReceiptDto>({
    fetchFn: goodsReceiptsApi.getAll,
    defaultSortBy: "ReceiptDate",
    defaultSortOrder: "desc"
  });

  const handleCreate = () => {
    setSelectedGRN(null);
    setIsFormOpen(true);
  };

  const handleView = (grn: GoodsReceiptDto) => {
    setSelectedGRN(grn);
    setIsDetailsOpen(true);
  };

  if (!canView) {
    return (
      <PageContainer>
        <ErrorView message="You do not have permission to view Goods Receipts." onRetry={() => window.history.back()} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Goods Receipts" 
        description="Manage physical receipt of materials into inventory against Purchase Orders."
        actions={
          <PermissionButton 
            permission="Permissions.GoodsReceipts.Create"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Receipt
          </PermissionButton>
        }
      />

      <SectionCard>
        <DataTableToolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search GRN, PO, or Supplier..."
          actions={
            <Button variant="outline" size="icon" onClick={refresh} title="Refresh Data">
              <RefreshCw className="w-4 h-4" />
            </Button>
          }
        />

        {viewState === "loading" && <LoadingView message="Loading goods receipts..." />}
        {viewState === "error" && <ErrorView message="Failed to load goods receipts" onRetry={refresh} />}
        
        {viewState === "success" && data && (
          data.items.length === 0 ? (
            <EmptyState 
              title="No goods receipts found" 
              description={queryParams.search ? "Try adjusting your search filters." : "Create your first goods receipt to update inventory."}
              icon={Archive}
              action={
                canCreate ? (
                  <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Receipt
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>
                        <SortableHeader 
                          label="GRN Number" 
                          field="GRNNumber" 
                          currentSortBy={queryParams.sortBy} 
                          currentSortOrder={queryParams.sortOrder} 
                          onSort={toggleSort} 
                        />
                      </TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>
                        <SortableHeader 
                          label="Receipt Date" 
                          field="ReceiptDate" 
                          currentSortBy={queryParams.sortBy} 
                          currentSortOrder={queryParams.sortOrder} 
                          onSort={toggleSort} 
                        />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((grn) => (
                      <TableRow key={grn.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{grn.grnNumber}</TableCell>
                        <TableCell>{grn.purchaseOrderNumber}</TableCell>
                        <TableCell>{grn.supplierName}</TableCell>
                        <TableCell>{formatDate(grn.receiptDate)}</TableCell>
                        <TableCell>{getStatusBadge(grn.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleView(grn)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                data={data}
                onPageChange={setPage}
              />
            </div>
          )
        )}
      </SectionCard>

      <GoodsReceiptFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={refresh}
      />

      {selectedGRN && (
        <GoodsReceiptDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          grnId={selectedGRN.id}
          onUpdate={refresh}
        />
      )}
    </PageContainer>
  );
}
