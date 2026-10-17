import { useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { auditLogsApi, AuditLog } from "@/api/auditLogs.api";

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
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";

export function AuditLogsListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.Roles.View"); // Fallback permission since AuditLog specific might not exist
  
  const {
    viewState,
    data,
    isFetching,
    queryParams,
    searchInput,
    setSearchInput,
    handleSearch,
    toggleSort,
    setPage,
    refresh
  } = useCrudTable<AuditLog>({
    fetchFn: auditLogsApi.getAll,
    defaultSortBy: "timestamp",
    defaultSortOrder: "desc"
  });

  if (!canView) {
    return <ErrorView message="You do not have permission to view audit logs." />;
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Audit Logs" 
        description="View system activity and audit trail."
      />

      <SectionCard>
        <DataTableToolbar
          searchPlaceholder="Search logs..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearch={handleSearch}
          onClear={() => { setSearchInput(""); handleSearch(); }}
          actionSlot={
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          }
        />

        {viewState === "loading" && <LoadingView message="Loading audit logs..." />}
        {viewState === "error" && <ErrorView message="Failed to load audit logs. Please try again." onRetry={refresh} />}
        {viewState === "empty" && (
          <EmptyState
            icon={Activity}
            title="No audit logs found"
            description="There is no activity matching your criteria."
            action={{ label: "Refresh", onClick: refresh }}
          />
        )}
        
        {viewState === "success" && data && (
          <div className="space-y-4">
            <div className={`rounded-md border overflow-hidden mt-4 transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Timestamp" field="timestamp" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} />
                    <SortableHeader label="User" field="userEmail" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} />
                    <SortableHeader label="Action" field="action" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} />
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <SortableHeader label="IP Address" field="ipAddress" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{log.userEmail}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entityName}</TableCell>
                      <TableCell className="max-w-xs truncate" title={log.details}>{log.details}</TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {data.totalPages > 1 && (
              <Pagination
                data={data}
                onPageChange={setPage}
              />
            )}
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
}

