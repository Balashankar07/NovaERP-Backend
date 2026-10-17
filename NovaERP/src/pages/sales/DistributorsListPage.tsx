import { useState, useMemo, useCallback } from "react";
import { RefreshCw, Building2, Plus } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { distributorsApi, DistributorDto } from "@/api/distributors.api";
import { PaginationParams } from "@/types/api.types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { CreateDistributorDialog } from "./components/CreateDistributorDialog";
import { PermissionButton } from "@/components/common/permission-button";

export function DistributorsListPage() {
  const { hasPermission } = usePermissions();
  const canView = true; 

  const [isActiveFilter] = useState<string>("all");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchDistributors = useCallback(
    (params: PaginationParams) => distributorsApi.getDistributors(params),
    [isActiveFilter]
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

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedRowIds(new Set(data.items.map(i => i.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const hasSelections = selectedRowIds.size > 0;

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <LoadingView title="Loading Distributors..." />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <ErrorView title="Failed to load distributors" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
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
      return data.items.map((distributor) => (
        <TableRow 
          key={distributor.id} 
          className="hover:bg-slate-50/50 transition-colors"
        >
          <TableCell className="pl-4">
            {/* selection box */}
          </TableCell>
          <TableCell>
            <div className="flex flex-col truncate">
              <span className="font-medium text-slate-900 truncate">{distributor.companyName}</span>
              <span className="text-xs text-slate-500 truncate">{distributor.distributorNumber}</span>
            </div>
          </TableCell>
          <TableCell className="text-slate-700 truncate">
            {distributor.contactPerson || "—"}
          </TableCell>
          <TableCell>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-700 truncate">{distributor.email || "—"}</span>
              <span className="text-sm text-slate-700 truncate">{distributor.phone || "—"}</span>
            </div>
          </TableCell>
          <TableCell>
            <span className="text-sm text-slate-700 truncate">{distributor.address || "—"}</span>
          </TableCell>
          <TableCell>
            <StatusBadge isActive={distributor.isActive} />
          </TableCell>
          <TableCell className="text-right pr-6">
            {/* Actions */}
          </TableCell>
        </TableRow>
      ));
    }
    return null;
  }, [viewState, data, queryParams.search, refresh]);

  if (!canView) {
    return <ErrorView title="Access Denied" description="You don't have permission to view distributors." />;
  }

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
              onClick={() => setCreateDialogOpen(true)}
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
            itemTypeName="distributors"
            className="flex-1 w-full border-none p-0"
          />
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[900px] w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[50px] pl-4"></TableHead>
                <SortableHeader label="Company" field="companyName" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[250px]" />
                <SortableHeader label="Contact Person" field="contactPerson" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[180px]" />
                <TableHead className="w-[200px]">Contact Info</TableHead>
                <TableHead className="w-[200px]">Address</TableHead>
                <SortableHeader label="Status" field="isActive" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[120px]" />
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

      <CreateDistributorDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          refresh();
        }}
      />
    </PageContainer>
  );
}
