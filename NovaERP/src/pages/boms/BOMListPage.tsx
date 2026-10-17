import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, Package, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { toast } from "@/utils/toast";
import { bomsApi } from "@/api/boms.api";
import { BOMDto } from "@/types/boms.types";

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
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

import { BOMFormDialog } from "./components/BOMFormDialog";
import { BOMDetailsDialog } from "./components/BOMDetailsDialog";

export function BOMListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.BOMs.View");
  const canCreate = hasPermission("Permissions.BOMs.Create");
  const canUpdate = hasPermission("Permissions.BOMs.Update");
  const canDelete = hasPermission("Permissions.BOMs.Delete");

  const [selectedBOM, setSelectedBOM] = useState<BOMDto | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    viewState,
    data,
    setData,
    queryParams,
    searchInput,
    setSearchInput,
    handleSearch,
    toggleSort,
    setPage,
    refresh
  } = useCrudTable<BOMDto>({
    fetchFn: bomsApi.getAll,
    defaultSortBy: "CreatedAt",
    defaultSortOrder: "desc"
  });

  const handleCreateOrUpdate = async (formData: any, isStatusOnly?: boolean) => {
    try {
      if (selectedBOM) {
        await bomsApi.update(selectedBOM.id, formData);
        toast.success(`BOM Version ${formData.version} updated successfully.`);
        
        if (isStatusOnly) {
          setData((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              items: prev.items.map((b: BOMDto) => b.id === selectedBOM.id ? { ...b, isActive: formData.isActive } : b)
            };
          });
          setIsFormOpen(false);
          return;
        }
      } else {
        await bomsApi.create(formData);
        toast.success(`BOM Version ${formData.version} created successfully.`);
      }
      setIsFormOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Operation failed.");
    }
  };

  const handleDelete = async () => {
    if (!selectedBOM) return;
    setIsDeleting(true);

    try {
      await bomsApi.delete(selectedBOM.id);
      toast.success("BOM deleted successfully.");
      setIsDeleteOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete BOM.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivate = async (bom: BOMDto) => {
    try {
      await bomsApi.activate(bom.id);
      toast.success(`BOM Version ${bom.version} activated successfully.`);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to activate BOM.");
    }
  };

  const handleDeactivate = async (bom: BOMDto) => {
    try {
      await bomsApi.deactivate(bom.id);
      toast.success(`BOM Version ${bom.version} deactivated successfully.`);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate BOM.");
    }
  };

  const openForm = (bom?: BOMDto) => {
    setSelectedBOM(bom);
    setIsFormOpen(true);
  };

  const openDetails = (bom: BOMDto) => {
    setSelectedBOM(bom);
    setIsDetailsOpen(true);
  };

  const openDelete = (bom: BOMDto) => {
    setSelectedBOM(bom);
    setIsDeleteOpen(true);
  };

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-64">
            <LoadingView />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-64">
            <ErrorView description="Failed to load BOMs" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-64">
            <EmptyState 
              icon={<Package className="w-8 h-8 text-slate-400" />}
              title="No BOMs found" 
              description={queryParams.search ? "Try adjusting your search query." : "Create your first Bill of Materials to get started."}
              action={canCreate ? { label: "Create BOM", onClick: () => openForm() } : undefined}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data) {
      return data.items.map((bom) => (
        <TableRow 
          key={bom.id} 
          className="group hover:bg-slate-50/50 transition-colors"
        >
          <TableCell>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center mr-3 shrink-0">
                <Package className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-slate-900 truncate" title={bom.productName}>{bom.productName}</span>
                <span className="text-xs text-slate-500 truncate" title={bom.description}>{bom.description || "-"}</span>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <span className="font-medium text-slate-700">{bom.version}</span>
          </TableCell>
          <TableCell>
            <span className="text-slate-600">{bom.items?.length || 0} components</span>
          </TableCell>
          <TableCell>
            <StatusBadge isActive={bom.isActive} />
          </TableCell>
          <TableCell className="text-right pr-6">
            <div className="flex items-center justify-end gap-2">
              {canUpdate && (
                <>
                  {!bom.isActive ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-emerald-600" onClick={() => handleActivate(bom)} title="Activate BOM">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-amber-600" onClick={() => handleDeactivate(bom)} title="Deactivate BOM">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600" onClick={() => openDetails(bom)} title="View Details">
                <Eye className="w-4 h-4" />
              </Button>
              {canUpdate && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => openForm(bom)} title="Edit BOM">
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-600" onClick={() => openDelete(bom)} title="Delete BOM">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      ));
    }
    return null;
  }, [viewState, data, queryParams.search, canCreate, canUpdate, canDelete]);

  if (!canView) {
    return <ErrorView title="Access Denied" description="You don't have permission to view Bills of Materials." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Bill of Materials"
        description="Manage product recipes and components for manufacturing."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <PermissionButton 
              permission="Permissions.BOMs.Create"
              onClick={() => openForm()} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 ml-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create BOM
            </PermissionButton>
          </>
        }
      />

      <SectionCard className="p-0 flex flex-col relative">
        <DataTableToolbar 
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search by product, version..."
          hasSelections={false}
          selectedCount={0}
          onDeleteSelected={() => {}}
          onCancelSelection={() => {}}
          itemTypeName="BOMs"
          deletePermission="Permissions.BOMs.Delete"
        />

        <div className="overflow-x-auto">
          <Table className="min-w-[800px] w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <SortableHeader label="Product" field="Product" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[300px] pl-4" />
                <SortableHeader label="Version" field="Version" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[150px]" />
                <TableHead className="w-[150px]">Components</TableHead>
                <SortableHeader label="Status" field="Status" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[100px]" />
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

      <BOMFormDialog 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        bom={selectedBOM}
        onSubmit={handleCreateOrUpdate}
      />

      <BOMDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        bom={selectedBOM || null}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName="BOM"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
