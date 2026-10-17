import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, LayoutGrid, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { toast } from "@/utils/toast";
import { unitsApi } from "@/api/units.api";
import { UnitDto, CreateUnitDto, UpdateUnitDto } from "@/types/units.types";

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

import { UnitFormDialog } from "./components/UnitFormDialog";
import { UnitDetailsDialog } from "./components/UnitDetailsDialog";

export function UnitsListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.Units.View");
  const canCreate = hasPermission("Permissions.Units.Create");
  const canUpdate = hasPermission("Permissions.Units.Update");
  const canDelete = hasPermission("Permissions.Units.Delete");

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
  } = useCrudTable<UnitDto>({
    fetchFn: unitsApi.getAll,
    defaultSortBy: "Name",
    defaultSortOrder: "asc"
  });

  // Dialogs State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  
  const [selectedUnit, setSelectedUnit] = useState<UnitDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateOrUpdate = async (formData: CreateUnitDto | UpdateUnitDto) => {
    if (selectedUnit) {
      await unitsApi.update(selectedUnit.id, formData as UpdateUnitDto);
      toast.success(`Unit "${formData.name}" updated successfully.`);
    } else {
      await unitsApi.create(formData as CreateUnitDto);
      toast.success(`Unit "${formData.name}" created successfully.`);
    }
    setIsFormOpen(false);
    refresh();
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;
    setIsDeleting(true);

    try {
      await unitsApi.delete(selectedUnit.id);
      toast.success("Unit deleted successfully.");
      setIsDeleteOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete unit.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openForm = (unit?: UnitDto) => {
    setSelectedUnit(unit || null);
    setIsFormOpen(true);
  };

  const openDetails = (unit: UnitDto) => {
    setSelectedUnit(unit);
    setIsDetailsOpen(true);
  };

  const openDelete = (unit: UnitDto) => {
    setSelectedUnit(unit);
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
          <TableCell colSpan={6} className="h-64">
            <LoadingView title="Loading Units..." />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-64">
            <ErrorView title="Failed to load units" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-64">
            <EmptyState 
              title="No units found" 
              description={queryParams.search ? "Try adjusting your search query." : "Get started by adding your first unit of measurement."}
              icon={<LayoutGrid className="w-8 h-8 text-slate-400" />}
              action={canCreate ? { label: "Add Unit", onClick: () => openForm() } : undefined}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data) {
      return data.items.map((unit) => (
        <TableRow 
          key={unit.id} 
          className={`group transition-colors ${selectedRowIds.has(unit.id) ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/50'}`}
        >
          <TableCell className="pl-4">
            <Checkbox 
              checked={selectedRowIds.has(unit.id)}
              onCheckedChange={(checked) => handleSelectRow(unit.id, checked === true)}
              aria-label={`Select ${unit.name}`}
            />
          </TableCell>
          <TableCell className="font-medium text-slate-900 truncate" title={unit.name}>{unit.name}</TableCell>
          <TableCell>
            <span className="font-mono text-slate-600 bg-slate-50/50 rounded-md inline-block px-2 py-0.5 border border-slate-100 truncate max-w-[100px]" title={unit.abbreviation}>
              {unit.abbreviation}
            </span>
          </TableCell>
          <TableCell className="text-slate-500 truncate" title={unit.description || ""}>
            {unit.description || "—"}
          </TableCell>
          <TableCell>
            <StatusBadge isActive={unit.isActive} />
          </TableCell>
          <TableCell className="text-right pr-6">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                onClick={() => openDetails(unit)}
                title="View Details"
                aria-label={`View Details for ${unit.name}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canUpdate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-blue-600"
                  onClick={() => openForm(unit)}
                  title="Edit Unit"
                  aria-label={`Edit ${unit.name}`}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-rose-600"
                  onClick={() => openDelete(unit)}
                  title="Delete Unit"
                  aria-label={`Delete ${unit.name}`}
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
    return <ErrorView title="Access Denied" description="You don't have permission to view units." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Units of Measurement"
        description="Manage standard units used for product quantities and dimensions."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <PermissionButton 
              permission="Permissions.Units.Create"
              onClick={() => openForm()} 
              aria-label="Add Unit" 
              className="h-9 bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </PermissionButton>
          </>
        }
      />

      <SectionCard className="p-0 flex flex-col relative">
        <DataTableToolbar 
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search units..."
          hasSelections={hasSelections}
          selectedCount={selectedRowIds.size}
          onDeleteSelected={() => setIsDeleteOpen(true)}
          onCancelSelection={() => setSelectedRowIds(new Set())}
          itemTypeName="units"
          deletePermission="Permissions.Units.Delete"
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
                  label="Unit Name"
                  currentSortBy={queryParams.sortBy}
                  currentSortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                  className="w-[250px]"
                />
                <SortableHeader
                  field="Abbreviation"
                  label="Abbreviation"
                  currentSortBy={queryParams.sortBy}
                  currentSortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                  className="w-[150px]"
                />
                <TableHead className="w-[200px]">Description</TableHead>
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

      <UnitFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
        unit={selectedUnit}
      />

      <UnitDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        unit={selectedUnit}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName="Unit"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
