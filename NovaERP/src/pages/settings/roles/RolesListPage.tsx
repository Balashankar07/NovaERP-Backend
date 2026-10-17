import { useState, useCallback } from "react";
import { Plus, Edit2, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { toast } from "@/utils/toast";
import { roleApi } from "@/api/role.api";
import { Role } from "@/types";

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
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

import { RoleFormDialog } from "./components/RoleFormDialog";
import { PermissionMatrixDialog } from "./components/PermissionMatrixDialog";

export function RolesListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.Roles.View");
  const canEdit = hasPermission("Permissions.Roles.Edit");
  const canDelete = hasPermission("Permissions.Roles.Delete");
  
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const fetchRoles = useCallback((params: any) => roleApi.getAll(params), []);

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
  } = useCrudTable<Role>({
    fetchFn: fetchRoles,
    defaultSortBy: "name",
  });



  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handlePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsMatrixOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRole) return;
    try {
      setIsDeleting(true);
      await roleApi.delete(selectedRole.id);
      toast.success("Role deleted successfully");
      setIsDeleteOpen(false);
      refresh();
    } catch (error) {
      toast.error("Failed to delete role");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowIds.size === 0) return;
    try {
      setIsBulkDeleting(true);
      await roleApi.bulkDelete(Array.from(selectedRowIds));
      toast.success(`${selectedRowIds.size} roles deleted successfully`);
      setSelectedRowIds(new Set());
      refresh();
    } catch (error) {
      toast.error("Failed to delete roles");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedRowIds(new Set(data.items.map((r) => r.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRowIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRowIds(newSelected);
  };

  if (!canView) {
    return <ErrorView title="Access Denied" message="You do not have permission to view roles." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Roles & Permissions"
        description="Manage system roles and assign capabilities."
        actions={
          <Button variant="outline" onClick={refresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <SectionCard className="p-0 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <DataTableToolbar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={handleSearch}
            searchPlaceholder="Search roles..."
            selectedCount={selectedRowIds.size}
            onDeleteSelected={handleBulkDelete}
            canDelete={canDelete}
          />
        </div>

        <div className="overflow-x-auto relative min-h-[400px]">
          {viewState === "loading" && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
              <LoadingView title="Loading Roles..." />
            </div>
          )}

          {viewState === "error" && (
            <div className="absolute inset-0 z-10 bg-white flex items-center justify-center">
              <ErrorView title="Failed to load roles" onRetry={refresh} />
            </div>
          )}

          {viewState === "empty" && (
            <div className="absolute inset-0 z-10 bg-white flex items-center justify-center">
              <EmptyState 
                title="No roles found"
                description={searchInput ? "Try adjusting your search terms." : "Get started by creating a new role."}
                actionLabel={undefined}
                onAction={() => {}}
                icon={ShieldCheck}
              />
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="w-[40px] px-4">
                  <Checkbox
                    checked={data?.items.length > 0 && selectedRowIds.size === data.items.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <SortableHeader
                  label="Role Name"
                  field="name"
                  currentSort={queryParams.sortBy}
                  sortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                />
                <TableHead>Description</TableHead>
                <SortableHeader
                  label="Status"
                  field="isActive"
                  currentSort={queryParams.sortBy}
                  sortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((role) => (
                <TableRow key={role.id} className="group hover:bg-slate-50/80 transition-colors">
                  <TableCell className="px-4">
                    <Checkbox
                      checked={selectedRowIds.has(role.id)}
                      onCheckedChange={(checked) => handleSelectRow(role.id, checked as boolean)}
                      aria-label={`Select ${role.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{role.name}</TableCell>
                  <TableCell className="text-slate-500 max-w-md truncate">{role.description}</TableCell>
                  <TableCell>
                    <StatusBadge
                      isActive={role.isActive}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                        <>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(role)}
                            title="Edit Role"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(role)}
                          title="Delete Role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data && data.totalCount > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <Pagination
              data={data}
              onPageChange={setPage}
            />
          </div>
        )}
      </SectionCard>

      <RoleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        role={selectedRole}
        onSuccess={refresh}
      />
      
      {selectedRole && (
        <PermissionMatrixDialog
          open={isMatrixOpen}
          onOpenChange={setIsMatrixOpen}
          role={selectedRole}
        />
      )}

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${selectedRole?.name}"? This action cannot be undone and will remove these permissions from all users assigned to this role.`}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </PageContainer>
  );
}
