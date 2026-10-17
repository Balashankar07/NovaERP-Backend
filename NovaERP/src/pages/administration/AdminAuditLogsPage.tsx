import { useState } from "react";
import { Activity, RefreshCw, Eye } from "lucide-react";
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
import { Modal } from "@/components/ui/modal";

export function AdminAuditLogsPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.Reports.Audit") || hasPermission("Permissions.Users.View");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
    initialSortBy: "timestamp",
  });

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  if (!canView) {
    return <ErrorView message="You do not have permission to view audit logs." />;
  }

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("ADD") || act.includes("INSERT")) {
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
    }
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REVOKE")) {
      return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("MODIFY")) {
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
    }
    if (act.includes("LOGIN") || act.includes("AUTH")) {
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20";
    }
    return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20";
  };

  return (
    <PageContainer>
      <PageHeader
        title="Audit Logs"
        subtitle="Complete immutable enterprise audit trail for security compliance and system traceability."
      />

      <SectionCard>
        <DataTableToolbar
          searchPlaceholder="Search by user, action, entity name or IP..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearch={handleSearch}
          onClear={() => { setSearchInput(""); handleSearch(); }}
          actionSlot={
            <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Logs
            </Button>
          }
        />

        {viewState === "loading" && <LoadingView message="Loading audit logs..." />}
        {viewState === "error" && <ErrorView message="Failed to load audit logs." onRetry={refresh} />}
        {viewState === "empty" && (
          <EmptyState
            icon={Activity}
            title="No audit log entries"
            description="No system activity recorded matching current criteria."
            action={{ label: "Refresh", onClick: refresh }}
          />
        )}

        {viewState === "success" && data && (
          <div className="space-y-4">
            <div className={`transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Timestamp" field="timestamp" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} />
                    <SortableHeader label="User" field="userEmail" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} />
                    <SortableHeader label="Action" field="action" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} />
                    <TableHead>Entity / Module</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <SortableHeader label="IP Address" field="ipAddress" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} />
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {log.userEmail || "System"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{log.entityName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.entityId || "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress || "127.0.0.1"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                          className="h-8 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-500/10"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
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
        )}
      </SectionCard>

      {/* Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          title="Audit Trail Entry Inspection"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50 border border-border text-xs">
              <div>
                <span className="text-muted-foreground font-semibold block mb-0.5">Audit Event ID</span>
                <span className="font-mono text-foreground font-medium">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block mb-0.5">Timestamp</span>
                <span className="text-foreground font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block mb-0.5">User</span>
                <span className="text-foreground font-semibold">{selectedLog.userEmail || "System"}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block mb-0.5">IP Address</span>
                <span className="font-mono text-foreground font-medium">{selectedLog.ipAddress || "127.0.0.1"}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block mb-0.5">Target Entity</span>
                <span className="text-foreground font-medium">{selectedLog.entityName}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block mb-0.5">Target ID</span>
                <span className="font-mono text-foreground font-medium">{selectedLog.entityId || "N/A"}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Old Values (Previous State)</span>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 text-xs font-mono overflow-x-auto max-h-36">
                {selectedLog.oldValues || "(No previous state recorded)"}
              </pre>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-1">New Values (Mutated State)</span>
              <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 border border-slate-800 text-xs font-mono overflow-x-auto max-h-36">
                {selectedLog.newValues || "(No payload parameters)"}
              </pre>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
                Close Inspection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
