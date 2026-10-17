import { useState, useMemo } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { qualityComplianceApi } from "@/api/qualityCompliance.api";
import { ScrapRecord, ScrapStatus } from "@/types/qualityCompliance.types";
import { Plus, RefreshCw, Trash2, CheckCircle, XCircle } from "lucide-react";

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

export function ScrapManagementPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canView = hasPermission("Permissions.Quality.Scrap.View");
  const canCreate = hasPermission("Permissions.Quality.Scrap.Create");
  const canApprove = hasPermission("Permissions.Quality.Scrap.Approve");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    qualityInspectionId: "",
    ncrId: "",
    productId: "",
    warehouseId: "",
    quantity: 1,
    reason: "",
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
  } = useCrudTable<ScrapRecord>({
    fetchFn: (params) => qualityComplianceApi.getScrapRecords(params),
    defaultSortBy: "CreatedAt",
    defaultSortOrder: "desc"
  });

  const createMutation = useMutation({
    mutationFn: qualityComplianceApi.createScrap,
    onSuccess: () => {
      toast.success("Scrap record created successfully");
      setIsCreateOpen(false);
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create Scrap record");
    }
  });

  const approveMutation = useMutation({
    mutationFn: (payload: { id: string; approve: boolean }) =>
      qualityComplianceApi.approveScrap(payload.id, payload.approve),
    onSuccess: (res, variables) => {
      if (variables.approve) {
        toast.success("Scrap approved & inventory disposal movement posted successfully");
      } else {
        toast.success("Scrap record rejected");
      }
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to approve/reject Scrap");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.qualityInspectionId || !formData.productId || !formData.warehouseId || formData.quantity <= 0) {
      toast.error("Please fill in required fields (Inspection ID, Product ID, Warehouse ID, Quantity > 0)");
      return;
    }
    createMutation.mutate({
      ...formData,
      ncrId: formData.ncrId ? formData.ncrId : undefined
    });
  };

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <LoadingView title="Loading Scrap Records..." />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <ErrorView title="Failed to load Scrap records" message="An error occurred while fetching scrap records." onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (!data?.items.length) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <EmptyState
              icon={Trash2}
              title="No Scrap Records"
              description="No material scrap or physical disposal records found."
            />
          </TableCell>
        </TableRow>
      );
    }

    return data.items.map((scrap) => (
      <TableRow key={scrap.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{scrap.scrapNumber}</TableCell>
        <TableCell>{scrap.qualityInspectionNumber || scrap.qualityInspectionId.substring(0, 8)}</TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{scrap.productName || "Product"}</div>
            <div className="text-xs text-slate-500">{scrap.productCode}</div>
          </div>
        </TableCell>
        <TableCell className="font-semibold text-rose-600 dark:text-rose-400">{scrap.quantity}</TableCell>
        <TableCell>{scrap.warehouseName || "Warehouse"}</TableCell>
        <TableCell>{scrap.reason}</TableCell>
        <TableCell>
          <StatusBadge status={scrap.status} />
        </TableCell>
        <TableCell className="text-right flex justify-end gap-2">
          {canApprove && scrap.status === 'Pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700"
                onClick={() => approveMutation.mutate({ id: scrap.id, approve: true })}
                disabled={approveMutation.isPending}
              >
                Approve & Dispose Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:text-rose-700"
                onClick={() => approveMutation.mutate({ id: scrap.id, approve: false })}
                disabled={approveMutation.isPending}
              >
                Reject
              </Button>
            </>
          )}
        </TableCell>
      </TableRow>
    ));
  }, [viewState, data, canApprove, refresh, approveMutation]);

  if (!canView) {
    return (
      <PageContainer>
        <ErrorView title="Access Denied" message="You do not have permission to view Scrap Records." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Scrap & Physical Disposal Management"
        description="Controlled physical stock disposal integration via inventory movement architecture."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            {canCreate && (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Record Scrap
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
          searchPlaceholder="Filter Scrap records by number, product, reason..."
        />

        <div className={`rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden mt-4 transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900">
                <SortableHeader label="Scrap #" field="ScrapNumber" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Inspection #" field="QualityInspectionId" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Product" field="ProductId" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Quantity" field="Quantity" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <TableHead>Warehouse</TableHead>
                <TableHead>Reason</TableHead>
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

      {/* Create Scrap Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Scrap Record</DialogTitle>
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
                <Label htmlFor="warehouseId">Warehouse ID *</Label>
                <Input
                  id="warehouseId"
                  placeholder="Warehouse GUID"
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Scrap Quantity *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="reason">Scrap Reason & Disposal Notes *</Label>
              <Textarea
                id="reason"
                placeholder="Detailed reason for scrapping stock..."
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
                {createMutation.isPending ? "Submitting..." : "Submit Scrap Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
