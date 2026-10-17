import { useState, useMemo } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { qualityComplianceApi } from "@/api/qualityCompliance.api";
import { ReworkRequest, ReworkStatus } from "@/types/qualityCompliance.types";
import { Plus, RefreshCw, Wrench, Play, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function ReworkManagementPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canView = hasPermission("Permissions.Quality.Rework.View");
  const canCreate = hasPermission("Permissions.Quality.Rework.Create");
  const canApprove = hasPermission("Permissions.Quality.Rework.Approve");
  const canComplete = hasPermission("Permissions.Quality.Rework.Complete");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    qualityInspectionId: "",
    ncrId: "",
    productId: "",
    quantity: 1,
    reason: "",
    assignedWorkCenterId: "",
    assignedEmployeeId: "",
  });

  const {
    viewState,
    data,
    isFetching,
    searchInput,
    setSearchInput,
    handleSearch,
    toggleSort,
    setPage,
    refresh
  } = useCrudTable<ReworkRequest>({
    fetchFn: (params) => qualityComplianceApi.getReworkRequests(params),
    defaultSortBy: "CreatedAt",
    defaultSortOrder: "desc"
  });

  const createMutation = useMutation({
    mutationFn: qualityComplianceApi.createRework,
    onSuccess: () => {
      toast.success("Rework request submitted successfully");
      setIsCreateOpen(false);
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create Rework request");
    }
  });

  const approveMutation = useMutation({
    mutationFn: (payload: { id: string; approve: boolean }) =>
      qualityComplianceApi.approveRework(payload.id, payload.approve),
    onSuccess: () => {
      toast.success("Rework request status updated");
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to approve/reject Rework");
    }
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => qualityComplianceApi.startRework(id),
    onSuccess: () => {
      toast.success("Rework process started");
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to start Rework");
    }
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => qualityComplianceApi.completeRework(id, "Rework process completed successfully"),
    onSuccess: () => {
      toast.success("Rework completed. Item sent for quality re-inspection.");
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to complete Rework");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.qualityInspectionId || !formData.productId || formData.quantity <= 0) {
      toast.error("Please fill in required fields (Inspection ID, Product ID, Quantity > 0)");
      return;
    }
    createMutation.mutate({
      ...formData,
      ncrId: formData.ncrId ? formData.ncrId : undefined,
      assignedWorkCenterId: formData.assignedWorkCenterId ? formData.assignedWorkCenterId : undefined,
      assignedEmployeeId: formData.assignedEmployeeId ? formData.assignedEmployeeId : undefined
    });
  };

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <LoadingView title="Loading Rework Requests..." />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <ErrorView title="Failed to load Rework requests" message="An error occurred while fetching rework requests." onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (!data?.items.length) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <EmptyState
              icon={Wrench}
              title="No Rework Requests"
              description="No internal rework requests currently active."
            />
          </TableCell>
        </TableRow>
      );
    }

    return data.items.map((rework) => (
      <TableRow key={rework.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{rework.reworkNumber}</TableCell>
        <TableCell>{rework.qualityInspectionNumber || rework.qualityInspectionId.substring(0, 8)}</TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{rework.productName || "Product"}</div>
            <div className="text-xs text-slate-500">{rework.productCode}</div>
          </div>
        </TableCell>
        <TableCell className="font-semibold">{rework.quantity}</TableCell>
        <TableCell>{rework.workCenterName || "Work Center"}</TableCell>
        <TableCell>{rework.assignedEmployeeName || "Unassigned"}</TableCell>
        <TableCell>
          <StatusBadge status={rework.status} />
        </TableCell>
        <TableCell className="text-right flex justify-end gap-2">
          {canApprove && rework.status === 'Requested' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700"
                onClick={() => approveMutation.mutate({ id: rework.id, approve: true })}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:text-rose-700"
                onClick={() => approveMutation.mutate({ id: rework.id, approve: false })}
              >
                Reject
              </Button>
            </>
          )}

          {canApprove && rework.status === 'Approved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => startMutation.mutate(rework.id)}
              disabled={startMutation.isPending}
            >
              <Play className="w-3.5 h-3.5 mr-1" /> Start
            </Button>
          )}

          {canComplete && rework.status === 'InProgress' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => completeMutation.mutate(rework.id)}
              disabled={completeMutation.isPending}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
            </Button>
          )}
        </TableCell>
      </TableRow>
    ));
  }, [viewState, data, canApprove, canComplete, refresh]);

  if (!canView) {
    return (
      <PageContainer>
        <ErrorView title="Access Denied" message="You do not have permission to view Rework Requests." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Rework Management"
        description="Internal manufacturing rework tracking connected to quality inspections and workforce execution."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            {canCreate && (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Request Rework
              </Button>
            )}
          </div>
        }
      />

      <SectionCard>
        <DataTableToolbar
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Filter Rework requests by number, product, reason..."
        />

        <div className={`rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden mt-4 transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900">
                <SortableHeader label="Rework #" field="ReworkNumber" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Inspection #" field="QualityInspectionId" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Product" field="ProductId" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Quantity" field="Quantity" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <TableHead>Work Center</TableHead>
                <TableHead>Assigned Worker</TableHead>
                <SortableHeader label="Status" field="Status" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderedRows}</TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              data={data}
              onPageChange={setPage}
            />
          </div>
        )}
      </SectionCard>

      {/* Create Rework Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Rework Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="qualityInspectionId">Quality Inspection ID *</Label>
              <Input
                id="qualityInspectionId"
                placeholder="Quality Inspection GUID"
                value={formData.qualityInspectionId}
                onChange={(e) => setFormData({ ...formData, qualityInspectionId: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product ID *</Label>
                <Input
                  id="productId"
                  placeholder="Product GUID"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.0001"
                  step="any"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedWorkCenterId">Work Center ID (Optional)</Label>
                <Input
                  id="assignedWorkCenterId"
                  placeholder="Work Center GUID"
                  value={formData.assignedWorkCenterId}
                  onChange={(e) => setFormData({ ...formData, assignedWorkCenterId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedEmployeeId">Assigned Worker ID (Optional)</Label>
                <Input
                  id="assignedEmployeeId"
                  placeholder="Employee Profile GUID"
                  value={formData.assignedEmployeeId}
                  onChange={(e) => setFormData({ ...formData, assignedEmployeeId: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Rework Instructions & Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Specific operational rework steps..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Submitting..." : "Submit Rework Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
