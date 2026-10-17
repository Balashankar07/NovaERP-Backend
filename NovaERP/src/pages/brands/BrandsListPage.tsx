import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, LayoutGrid, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { toast } from "@/utils/toast";
import { brandsApi } from "@/api/brands.api";
import { BrandDto, CreateBrandDto, UpdateBrandDto } from "@/types/brands.types";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

import { BrandFormDialog } from "./components/BrandFormDialog";
import { BrandDetailsDialog } from "./components/BrandDetailsDialog";

export function BrandsListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.Brands.View");
  const canCreate = hasPermission("Permissions.Brands.Create");
  const canUpdate = hasPermission("Permissions.Brands.Update");
  const canDelete = hasPermission("Permissions.Brands.Delete");

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
  } = useCrudTable<BrandDto>({
    fetchFn: brandsApi.getAll,
    defaultSortBy: "Name",
    defaultSortOrder: "asc"
  });

  // Dialogs State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  
  const [selectedBrand, setSelectedBrand] = useState<BrandDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateOrUpdate = async (formData: CreateBrandDto | UpdateBrandDto) => {
    if (selectedBrand) {
      await brandsApi.update(selectedBrand.id, formData as UpdateBrandDto);
      toast.success(`Brand "${formData.name}" updated successfully.`);
    } else {
      await brandsApi.create(formData as CreateBrandDto);
      toast.success(`Brand "${formData.name}" created successfully.`);
    }
    setIsFormOpen(false);
    refresh();
  };

  const handleDelete = async () => {
    if (!selectedBrand) return;
    setIsDeleting(true);

    try {
      await brandsApi.delete(selectedBrand.id);
      toast.success("Brand deleted successfully.");
      setIsDeleteOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete brand.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openForm = (brand?: BrandDto) => {
    setSelectedBrand(brand || null);
    setIsFormOpen(true);
  };

  const openDetails = (brand: BrandDto) => {
    setSelectedBrand(brand);
    setIsDetailsOpen(true);
  };

  const openDelete = (brand: BrandDto) => {
    setSelectedBrand(brand);
    setIsDeleteOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedRowIds(new Set(data.items.map(i => i.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSet = new Set(selectedRowIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedRowIds(newSet);
  };

  const hasSelections = selectedRowIds.size > 0;

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-64">
            <LoadingView title="Loading Brands..." />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-64">
            <ErrorView title="Failed to load brands" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-64">
            <EmptyState 
              title="No brands found" 
              description={queryParams.search ? "Try adjusting your search query." : "Get started by adding your first brand."}
              icon={<LayoutGrid className="w-8 h-8 text-slate-400" />}
              action={canCreate ? { label: "Add Brand", onClick: () => openForm() } : undefined}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data) {
      return data.items.map((brand) => (
        <TableRow 
          key={brand.id} 
          className={`group transition-colors ${selectedRowIds.has(brand.id) ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/50'}`}
        >
          <TableCell className="pl-4">
            <Checkbox 
              checked={selectedRowIds.has(brand.id)}
              onCheckedChange={(checked) => handleSelectRow(brand.id, checked === true)}
              aria-label={`Select ${brand.name}`}
            />
          </TableCell>
          <TableCell className="font-medium text-slate-900 truncate" title={brand.name}>{brand.name}</TableCell>
          <TableCell className="text-slate-500 truncate" title={brand.description || ""}>
            {brand.description || "—"}
          </TableCell>
          <TableCell>
            <StatusBadge isActive={brand.isActive} />
          </TableCell>
          <TableCell className="text-right pr-6">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                onClick={() => openDetails(brand)}
                title="View Details"
                aria-label={`View Details for ${brand.name}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canUpdate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-blue-600"
                  onClick={() => openForm(brand)}
                  title="Edit Brand"
                  aria-label={`Edit ${brand.name}`}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-rose-600"
                  onClick={() => openDelete(brand)}
                  title="Delete Brand"
                  aria-label={`Delete ${brand.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      ));
    }
    return null;
  }, [viewState, data, queryParams.search, selectedRowIds, canCreate, canUpdate, canDelete]);

  if (!canView) {
    return <ErrorView title="Access Denied" description="You don't have permission to view brands." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Brands Management"
        description="Manage product brands and their configurations."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <PermissionButton 
              permission="Permissions.Brands.Create"
              onClick={() => openForm()} 
              aria-label="Add Brand" 
              className="h-9 bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </PermissionButton>
          </>
        }
      />

      <SectionCard className="p-0 flex flex-col relative">
        <DataTableToolbar 
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search brands..."
          hasSelections={hasSelections}
          selectedCount={selectedRowIds.size}
          onDeleteSelected={() => setIsDeleteOpen(true)}
          onCancelSelection={() => setSelectedRowIds(new Set())}
          itemTypeName="brands"
          deletePermission="Permissions.Brands.Delete"
        />
        <div className="overflow-x-auto">
          <Table className="min-w-[800px] w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[50px] pl-4">
                  <Checkbox 
                    checked={!!(data && data.items.length > 0 && selectedRowIds.size === data.items.length)}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <SortableHeader
                  field="Name"
                  label="Brand Name"
                  currentSortBy={queryParams.sortBy}
                  currentSortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                  className="w-[300px]"
                />
                <TableHead className="w-[300px]">Description</TableHead>
                <SortableHeader
                  field="IsActive"
                  label="Status"
                  currentSortBy={queryParams.sortBy}
                  currentSortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                  className="w-[120px]"
                />
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

      {/* Reusable Dialogs */}
      <BrandFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
        brand={selectedBrand}
      />

      <BrandDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        brand={selectedBrand}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName="Brand"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
