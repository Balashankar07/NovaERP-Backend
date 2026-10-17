import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, LayoutGrid, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { toast } from "@/utils/toast";
import { categoriesApi } from "@/api/categories.api";
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from "@/types/categories.types";

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

import { CategoryFormDialog } from "./components/CategoryFormDialog";
import { CategoryDetailsDialog } from "./components/CategoryDetailsDialog";

export function CategoriesListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.ProductCategories.View");
  const canCreate = hasPermission("Permissions.ProductCategories.Create");
  const canUpdate = hasPermission("Permissions.ProductCategories.Update");
  const canDelete = hasPermission("Permissions.ProductCategories.Delete");

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
  } = useCrudTable<CategoryDto>({
    fetchFn: categoriesApi.getAll,
    defaultSortBy: "Name",
    defaultSortOrder: "asc"
  });

  // Dialogs State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateOrUpdate = async (formData: CreateCategoryDto | UpdateCategoryDto) => {
    if (selectedCategory) {
      await categoriesApi.update(selectedCategory.id, formData as UpdateCategoryDto);
      toast.success(`Category "${formData.name}" updated successfully.`);
    } else {
      await categoriesApi.create(formData as CreateCategoryDto);
      toast.success(`Category "${formData.name}" created successfully.`);
    }
    setIsFormOpen(false);
    refresh();
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setIsDeleting(true);

    try {
      await categoriesApi.delete(selectedCategory.id);
      toast.success("Category deleted successfully.");
      setIsDeleteOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openForm = (category?: CategoryDto) => {
    setSelectedCategory(category || null);
    setIsFormOpen(true);
  };

  const openDetails = (category: CategoryDto) => {
    setSelectedCategory(category);
    setIsDetailsOpen(true);
  };

  const openDelete = (category: CategoryDto) => {
    setSelectedCategory(category);
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
            <LoadingView title="Loading Categories..." />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-64">
            <ErrorView title="Failed to load categories" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-64">
            <EmptyState 
              title="No categories found" 
              description={queryParams.search ? "Try adjusting your search query." : "Get started by adding your first category."}
              icon={<LayoutGrid className="w-8 h-8 text-slate-400" />}
              action={canCreate ? { label: "Add Category", onClick: () => openForm() } : undefined}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data) {
      return data.items.map((category) => (
        <TableRow 
          key={category.id} 
          className={`group transition-colors ${selectedRowIds.has(category.id) ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/50'}`}
        >
          <TableCell className="pl-4">
            <Checkbox 
              checked={selectedRowIds.has(category.id)}
              onCheckedChange={(checked) => handleSelectRow(category.id, checked === true)}
              aria-label={`Select ${category.name}`}
            />
          </TableCell>
          <TableCell className="font-medium text-slate-900 truncate" title={category.name}>{category.name}</TableCell>
          <TableCell className="text-slate-500 truncate" title={category.description || ""}>
            {category.description || "—"}
          </TableCell>
          <TableCell>
            <StatusBadge isActive={category.isActive} />
          </TableCell>
          <TableCell className="text-right pr-6">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                onClick={() => openDetails(category)}
                title="View Details"
                aria-label={`View Details for ${category.name}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canUpdate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-blue-600"
                  onClick={() => openForm(category)}
                  title="Edit Category"
                  aria-label={`Edit ${category.name}`}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-rose-600"
                  onClick={() => openDelete(category)}
                  title="Delete Category"
                  aria-label={`Delete ${category.name}`}
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
    return <ErrorView title="Access Denied" description="You don't have permission to view categories." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Categories Management"
        description="Manage product categories and their configurations."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <PermissionButton 
              permission="Permissions.Categories.Create"
              onClick={() => openForm()} 
              aria-label="Add Category" 
              className="h-9 bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </PermissionButton>
          </>
        }
      />

      <SectionCard className="p-0 flex flex-col relative">
        <DataTableToolbar 
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search categories..."
          hasSelections={hasSelections}
          selectedCount={selectedRowIds.size}
          onDeleteSelected={() => setIsDeleteOpen(true)}
          onCancelSelection={() => setSelectedRowIds(new Set())}
          itemTypeName="categories"
          deletePermission="Permissions.Categories.Delete"
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
                  label="Category Name"
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

      <CategoryFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
        category={selectedCategory}
      />

      <CategoryDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        category={selectedCategory}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName="Category"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
