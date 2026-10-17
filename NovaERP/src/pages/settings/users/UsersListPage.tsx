import { useState } from "react";
import { Plus, Edit2, Trash2, Users, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { toast } from "@/utils/toast";
import { userApi } from "@/api/user.api";
import { User } from "@/types";

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

import { UserFormDialog } from "./components/UserFormDialog";

export function UsersListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.Users.View");
  const canCreate = hasPermission("Permissions.Users.Create");
  const canEdit = hasPermission("Permissions.Users.Edit");
  const canDelete = hasPermission("Permissions.Users.Delete");
  
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

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
  } = useCrudTable<User>({
    fetchFn: userApi.getAll,
    initialSortBy: "firstName",
  });

  const handleCreate = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      setIsDeleting(true);
      await userApi.delete(selectedUser.id);
      toast.success("User deleted successfully");
      setIsDeleteOpen(false);
      refresh();
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowIds.size === 0) return;
    try {
      setIsBulkDeleting(true);
      await userApi.bulkDelete(Array.from(selectedRowIds));
      toast.success(`${selectedRowIds.size} users deleted successfully`);
      setSelectedRowIds(new Set());
      refresh();
    } catch (error) {
      toast.error("Failed to delete users");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleActivate = async (user: User) => {
    try {
      await userApi.activate(user.id);
      toast.success("User activated successfully");
      refresh();
    } catch (error) {
      toast.error("Failed to activate user");
    }
  };

  const handleDeactivate = async (user: User) => {
    try {
      await userApi.deactivate(user.id);
      toast.success("User deactivated successfully");
      refresh();
    } catch (error) {
      toast.error("Failed to deactivate user");
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
    return <ErrorView title="Access Denied" message="You do not have permission to view users." />;
  }

  const getUserStatus = (user: User) => {
    return user.isActive 
      ? { status: "active" as const, label: "Active" }
      : { status: "inactive" as const, label: "Inactive" };
  };

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Manage system access and assign roles to users."
        actions={
          <>
            <Button variant="outline" onClick={refresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <PermissionButton
              permission="Permissions.Users.Create"
              onClick={handleCreate}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add User
            </PermissionButton>
          </>
        }
      />

      <SectionCard className="p-0 flex flex-col relative overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <DataTableToolbar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            onSearchSubmit={handleSearch}
            searchPlaceholder="Search users by email or name..."
            selectedCount={selectedRowIds.size}
            onDeleteSelected={handleBulkDelete}
            canDelete={canDelete}
          />
        </div>

        <div className="overflow-x-auto relative min-h-[400px]">
          {viewState === "loading" && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
              <LoadingView title="Loading Users..." />
            </div>
          )}

          {viewState === "error" && (
            <div className="absolute inset-0 z-10 bg-white flex items-center justify-center">
              <ErrorView title="Failed to load users" onRetry={refresh} />
            </div>
          )}

          {viewState === "empty" && (
            <div className="absolute inset-0 z-10 bg-white flex items-center justify-center">
              <EmptyState 
                title="No users found"
                description={searchInput ? "Try adjusting your search terms." : "Get started by creating a new user."}
                actionLabel={!searchInput && canCreate ? "Create User" : undefined}
                onAction={handleCreate}
                icon={Users}
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
                  label="Name"
                  field="firstName"
                  currentSort={queryParams.sortBy}
                  sortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                />
                <SortableHeader
                  label="Email"
                  field="email"
                  currentSort={queryParams.sortBy}
                  sortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                />
                <TableHead>Role</TableHead>
                <SortableHeader
                  label="Account Status"
                  field="isActive"
                  currentSort={queryParams.sortBy}
                  sortOrder={queryParams.sortOrder}
                  onSort={toggleSort}
                />
                <TableHead>Identity Status</TableHead>
                <TableHead>Operational Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((user) => {
                const opStatus = getUserStatus(user);
                return (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4">
                      <Checkbox
                        checked={selectedRowIds.has(user.id)}
                        onCheckedChange={(checked) => handleSelectRow(user.id, checked as boolean)}
                        aria-label={`Select ${user.email}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-indigo-700">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        {user.firstName} {user.lastName}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(!user.assignedRoles || user.assignedRoles.length === 0) ? (
                          <span className="text-xs text-slate-400 italic">No roles</span>
                        ) : (
                          user.assignedRoles.map(r => (
                            <span key={r.roleId} className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${r.isOperationallyReady ? 'bg-indigo-50 text-indigo-700 ring-indigo-700/10' : 'bg-slate-50 text-slate-600 ring-slate-500/10'}`}>
                              {r.roleName}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={user.isActive ? "active" : "inactive"}
                        label={user.isActive ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={user.googleSubjectLinked ? "success" : "warning"}
                        label={user.googleSubjectLinked ? "Linked" : "Pending Google Link"}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={opStatus.status as any}
                        label={opStatus.label}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => user.isActive ? handleDeactivate(user) : handleActivate(user)}
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEdit(user)}
                              title="Edit User"
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
                            onClick={() => handleDeleteClick(user)}
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
        onSuccess={refresh}
      />
      
      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete User"
        description={`Are you sure you want to delete the user "${selectedUser?.firstName} ${selectedUser?.lastName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </PageContainer>
  );
}
