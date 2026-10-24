import { useState, useMemo, useCallback } from "react";
import { 
  RefreshCw, 
  Building2, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal 
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { distributorsApi, DistributorDto } from "@/api/distributors.api";
import { PaginationParams } from "@/types/api.types";
import { toast } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { DistributorFormDialog } from "./components/DistributorFormDialog";
import { DistributorDetailsDialog } from "./components/DistributorDetailsDialog";

export function DistributorsListPage() {
  const { hasPermission } = usePermissions();
  const canView = true;
  const canUpdate = hasPermission("Permissions.SalesOrders.Update");
  const canDelete = hasPermission("Permissions.SalesOrders.Delete");

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  
  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorDto | null>(null);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDistributor, setDetailsDistributor] = useState<DistributorDto | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [distributorToDelete, setDistributorToDelete] = useState<DistributorDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchDistributors = useCallback(
    (params: PaginationParams) => distributorsApi.getDistributors(params),
    []
  );

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
  } = useCrudTable<DistributorDto>({
    fetchFn: fetchDistributors,
    defaultSortBy: "companyName",
    defaultSortOrder: "asc"
  });

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedRowIds(new Set(data.items.map(i => i.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const hasSelections = selectedRowIds.size > 0;

  // Action handlers
  const handleOpenAdd = () => {
    setSelectedDistributor(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (distributor: DistributorDto) => {
    setSelectedDistributor(distributor);
    setFormDialogOpen(true);
  };

  const handleOpenDetails = (distributor: DistributorDto) => {
    setDetailsDistributor(distributor);
    setDetailsDialogOpen(true);
  };

  const handleOpenDelete = (distributor: DistributorDto) => {
    setDistributorToDelete(distributor);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (distributor: DistributorDto) => {
    try {
      await distributorsApi.toggleDistributorStatus(distributor.id);
      toast.success(
        `Distributor ${distributor.companyName} ${distributor.isActive ? "deactivated" : "activated"} successfully.`
      );
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update distributor status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!distributorToDelete) return;
    try {
      setIsDeleting(true);
      await distributorsApi.deleteDistributor(distributorToDelete.id);
      toast.success(`Distributor "${distributorToDelete.companyName}" deleted successfully.`);
      setDeleteDialogOpen(false);
      setDistributorToDelete(null);
      refresh();
    } catch (err: any) {
      if (err.status === 409 || err.response?.status === 409) {
        toast.error("Distributor cannot be deleted because it is referenced by existing sales orders. Deactivate the distributor instead.");
      } else {
        toast.error(err.message || "Failed to delete distributor.");
      }
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedRowIds.size === 0) return;
    try {
      setIsBulkDeleting(true);
      let successCount = 0;
      let failureCount = 0;

      for (const id of selectedRowIds) {
        try {
          await distributorsApi.deleteDistributor(id);
          successCount++;
        } catch {
          failureCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} distributor(s).`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} distributor(s) could not be deleted as they are referenced by sales records.`);
      }

      setSelectedRowIds(new Set());
      setBulkDeleteDialogOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to perform bulk deletion.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-64">
            <LoadingView title="Loading Distributors..." />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-64">
            <ErrorView title="Failed to load distributors" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-64">
            <EmptyState 
              title="No distributors found" 
              description={queryParams.search ? "Try adjusting your search query." : "Get started by adding your first distributor."}
              icon={<Building2 className="w-8 h-8 text-slate-400" />}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data) {
      const allSelected = data.items.length > 0 && data.items.every(item => selectedRowIds.has(item.id));

      return data.items.map((distributor) => {
        const isSelected = selectedRowIds.has(distributor.id);

        return (
          <TableRow 
            key={distributor.id} 
            className={`hover:bg-slate-50/60 transition-colors ${isSelected ? "bg-indigo-50/40" : ""}`}
          >
            <TableCell className="pl-4">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={(checked) => handleSelectRow(distributor.id, checked === true)}
                aria-label={`Select ${distributor.companyName}`}
              />
            </TableCell>
            <TableCell>
              <div className="flex flex-col truncate">
                <span className="font-semibold text-slate-900 truncate">{distributor.companyName}</span>
                {distributor.distributorNumber && (
                  <span className="text-xs font-mono text-slate-400 truncate">{distributor.distributorNumber}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-slate-700 truncate">
              {distributor.contactPerson || "—"}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-slate-700 truncate">{distributor.email || "—"}</span>
                {distributor.phone && (
                  <span className="text-xs text-slate-500 truncate">{distributor.phone}</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-slate-700 truncate">{distributor.address || "—"}</span>
            </TableCell>
            <TableCell>
              <StatusBadge isActive={distributor.isActive} />
            </TableCell>
            <TableCell className="text-right pr-6">
              <div className="flex items-center justify-end gap-1">
                {/* Status Toggle Button (Update operation) */}
                {canUpdate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${
                      distributor.isActive 
                        ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50" 
                        : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                    }`}
                    onClick={() => handleToggleStatus(distributor)}
                    title={distributor.isActive ? "Deactivate Account" : "Activate Account"}
                    aria-label={`${distributor.isActive ? "Deactivate" : "Activate"} ${distributor.companyName}`}
                  >
                    {distributor.isActive ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </Button>
                )}

                {/* View Details Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => handleOpenDetails(distributor)}
                  title="View Details"
                  aria-label={`View Details for ${distributor.companyName}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>

                {/* Edit Distributor Button (Update operation) */}
                {canUpdate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => handleOpenEdit(distributor)}
                    title="Edit Distributor"
                    aria-label={`Edit ${distributor.companyName}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}

                {/* Delete Distributor Button */}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => handleOpenDelete(distributor)}
                    title="Delete Distributor"
                    aria-label={`Delete ${distributor.companyName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                {/* Actions Dropdown Menu List */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      title="More Operations"
                      aria-label={`More operations for ${distributor.companyName}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg border border-slate-200">
                    <DropdownMenuItem 
                      onClick={() => handleOpenDetails(distributor)} 
                      className="cursor-pointer"
                    >
                      <Eye className="w-4 h-4 mr-2 text-indigo-500" /> View Details
                    </DropdownMenuItem>

                    {canUpdate && (
                      <DropdownMenuItem 
                        onClick={() => handleOpenEdit(distributor)} 
                        className="cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4 mr-2 text-blue-500" /> Edit Information
                      </DropdownMenuItem>
                    )}

                    {canUpdate && (
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(distributor)} 
                        className="cursor-pointer"
                      >
                        {distributor.isActive ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2 text-amber-500" /> Deactivate Account
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Activate Account
                          </>
                        )}
                      </DropdownMenuItem>
                    )}

                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleOpenDelete(distributor)} 
                          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        );
      });
    }
    return null;
  }, [viewState, data, queryParams.search, selectedRowIds, canUpdate, canDelete, refresh]);

  if (!canView) {
    return <ErrorView title="Access Denied" description="You don't have permission to view distributors." />;
  }

  const isAllSelected = !!(data && data.items.length > 0 && data.items.every(i => selectedRowIds.has(i.id)));

  return (
    <PageContainer>
      <PageHeader
        title="B2B Distributor Accounts"
        description="Manage B2B distributor information, contacts, and business profiles."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <PermissionButton 
              permission="Permissions.SalesOrders.Create"
              onClick={handleOpenAdd}
              className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Distributor
            </PermissionButton>
          </div>
        }
      />

      <SectionCard className="p-0 flex flex-col relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-slate-100 gap-4">
          <DataTableToolbar 
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={handleSearch}
            searchPlaceholder="Search by Company, Contact, Email..."
            hasSelections={hasSelections}
            selectedCount={selectedRowIds.size}
            onDeleteSelected={canDelete ? () => setBulkDeleteDialogOpen(true) : undefined}
            onCancelSelection={() => setSelectedRowIds(new Set())}
            itemTypeName="distributors"
            deletePermission="Permissions.SalesOrders.Delete"
            className="flex-1 w-full border-none p-0"
          />
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[950px] w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[50px] pl-4">
                  <Checkbox 
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <SortableHeader 
                  label="Company" 
                  field="companyName" 
                  currentSortBy={queryParams.sortBy} 
                  currentSortOrder={queryParams.sortOrder} 
                  onSort={toggleSort} 
                  className="w-[230px]" 
                />
                <SortableHeader 
                  label="Contact Person" 
                  field="contactPerson" 
                  currentSortBy={queryParams.sortBy} 
                  currentSortOrder={queryParams.sortOrder} 
                  onSort={toggleSort} 
                  className="w-[170px]" 
                />
                <TableHead className="w-[200px]">Contact Info</TableHead>
                <TableHead className="w-[180px]">Address</TableHead>
                <SortableHeader 
                  label="Status" 
                  field="isActive" 
                  currentSortBy={queryParams.sortBy} 
                  currentSortOrder={queryParams.sortOrder} 
                  onSort={toggleSort} 
                  className="w-[110px]" 
                />
                <TableHead className="text-right pr-6 w-[180px]">Actions</TableHead>
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

      {/* Add / Edit Distributor Dialog */}
      <DistributorFormDialog 
        open={formDialogOpen} 
        onOpenChange={setFormDialogOpen}
        distributor={selectedDistributor}
        onSuccess={() => {
          refresh();
        }}
      />

      {/* View Details Dialog */}
      <DistributorDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        distributor={detailsDistributor}
        onEdit={(dist) => {
          handleOpenEdit(dist);
        }}
      />

      {/* Single Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={`Distributor "${distributorToDelete?.companyName || ''}"`}
        isLoading={isDeleting}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete ${selectedRowIds.size} Selected Distributors`}
        description={`Are you sure you want to delete ${selectedRowIds.size} selected distributors? This operation cannot be undone.`}
        isLoading={isBulkDeleting}
      />
    </PageContainer>
  );
}
export default DistributorsListPage;
