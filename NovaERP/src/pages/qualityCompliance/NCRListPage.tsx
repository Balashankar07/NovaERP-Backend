import { useState, useMemo } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { qualityComplianceApi } from "@/api/qualityCompliance.api";
import { NonConformanceReport, NcrSeverity } from "@/types/qualityCompliance.types";
import { useNavigate } from "react-router-dom";
import { Eye, Plus, AlertTriangle, ShieldCheck, RefreshCw, Filter } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function NCRListPage() {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canView = hasPermission("Permissions.Quality.NCR.View");
  const canCreate = hasPermission("Permissions.Quality.NCR.Create");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    qualityInspectionId: "",
    productId: "",
    category: "Material Defect",
    severity: "Minor" as NcrSeverity,
    description: "",
    containmentAction: "",
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
  } = useCrudTable<NonConformanceReport>({
    fetchFn: (params) => qualityComplianceApi.getNcrs(params),
    defaultSortBy: "CreatedAt",
    defaultSortOrder: "desc"
  });

  const createMutation = useMutation({
    mutationFn: qualityComplianceApi.createNcr,
    onSuccess: () => {
      toast.success("Non-Conformance Report created successfully");
      setIsCreateOpen(false);
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create NCR");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.qualityInspectionId || !formData.productId || !formData.description) {
      toast.error("Please fill in required fields (Inspection ID, Product ID, Description)");
      return;
    }
    createMutation.mutate(formData);
  };

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <LoadingView title="Loading Non-Conformance Reports..." />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <ErrorView title="Failed to load NCRs" message="An error occurred while fetching NCR records." onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (!data?.items.length) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <EmptyState
              icon={AlertTriangle}
              title="No NCRs Found"
              description="No non-conformance reports match your current criteria."
            />
          </TableCell>
        </TableRow>
      );
    }

    return data.items.map((ncr) => (
      <TableRow key={ncr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{ncr.ncrNumber}</TableCell>
        <TableCell>{ncr.qualityInspectionNumber || ncr.qualityInspectionId.substring(0, 8)}</TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{ncr.productName || "Product"}</div>
            <div className="text-xs text-slate-500">{ncr.productCode}</div>
          </div>
        </TableCell>
        <TableCell>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            ncr.severity === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
            ncr.severity === 'Major' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            {ncr.severity}
          </span>
        </TableCell>
        <TableCell>{ncr.category}</TableCell>
        <TableCell>
          <StatusBadge status={ncr.status} />
        </TableCell>
        <TableCell>{ncr.reportedByUserName || "Inspector"}</TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/quality-compliance/ncrs/${ncr.id}`)}
          >
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>
        </TableCell>
      </TableRow>
    ));
  }, [viewState, data, navigate, refresh]);

  if (!canView) {
    return (
      <PageContainer>
        <ErrorView title="Access Denied" message="You do not have permission to view Non-Conformance Reports." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Non-Conformance Reports (NCR)"
        description="Log, track, investigate, and close material and manufacturing quality non-conformances."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            {canCreate && (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create NCR
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
          searchPlaceholder="Filter NCRs by number, product, category..."
        />

        <div className={`rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden mt-4 transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900">
                <SortableHeader label="NCR #" field="NcrNumber" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Inspection #" field="QualityInspectionId" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Product" field="ProductId" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Severity" field="Severity" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Category" field="Category" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Status" field="Status" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <TableHead>Reported By</TableHead>
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

      {/* Create NCR Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Non-Conformance Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="qualityInspectionId">Quality Inspection ID *</Label>
              <Input
                id="qualityInspectionId"
                placeholder="Enter Quality Inspection GUID"
                value={formData.qualityInspectionId}
                onChange={(e) => setFormData({ ...formData, qualityInspectionId: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productId">Product ID *</Label>
              <Input
                id="productId"
                placeholder="Enter Product GUID"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(val: NcrSeverity) => setFormData({ ...formData, severity: val })}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minor">Minor</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. Dimension, Visual, Function"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed explanation of non-conformance..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="containmentAction">Immediate Containment Action</Label>
              <Textarea
                id="containmentAction"
                placeholder="Immediate actions taken to quarantine stock..."
                value={formData.containmentAction}
                onChange={(e) => setFormData({ ...formData, containmentAction: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create NCR"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
