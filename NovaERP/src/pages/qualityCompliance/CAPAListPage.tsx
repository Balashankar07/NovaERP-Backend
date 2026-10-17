import { useState, useMemo } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { qualityComplianceApi } from "@/api/qualityCompliance.api";
import { Capa, CapaType, CapaStatus } from "@/types/qualityCompliance.types";
import { Plus, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";

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

export function CAPAListPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canView = hasPermission("Permissions.Quality.CAPA.View");
  const canCreate = hasPermission("Permissions.Quality.CAPA.Create");
  const canVerify = hasPermission("Permissions.Quality.CAPA.Verify");
  const canClose = hasPermission("Permissions.Quality.CAPA.Close");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState<Capa | null>(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const [formData, setFormData] = useState({
    ncrId: "",
    type: "Corrective" as CapaType,
    title: "",
    description: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    ownerEmployeeId: "",
    targetDate: "",
  });

  const [verifyData, setVerifyData] = useState({
    isEffective: true,
    verificationNotes: "",
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
  } = useCrudTable<Capa>({
    fetchFn: (params) => qualityComplianceApi.getCapas(params),
    defaultSortBy: "CreatedAt",
    defaultSortOrder: "desc"
  });

  const createMutation = useMutation({
    mutationFn: qualityComplianceApi.createCapa,
    onSuccess: () => {
      toast.success("CAPA action created successfully");
      setIsCreateOpen(false);
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create CAPA");
    }
  });

  const verifyMutation = useMutation({
    mutationFn: (payload: { id: string; isEffective: boolean; notes: string }) =>
      qualityComplianceApi.verifyCapa(payload.id, payload.isEffective, payload.notes),
    onSuccess: () => {
      toast.success("CAPA verification recorded");
      setIsVerifyOpen(false);
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to verify CAPA");
    }
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => qualityComplianceApi.closeCapa(id, "Closed after verification"),
    onSuccess: () => {
      toast.success("CAPA closed successfully");
      refresh();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to close CAPA");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ncrId || !formData.title || !formData.ownerEmployeeId) {
      toast.error("Please fill in required fields (NCR ID, Title, Owner Employee ID)");
      return;
    }
    createMutation.mutate(formData);
  };

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <LoadingView title="Loading CAPA Actions..." />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <ErrorView title="Failed to load CAPAs" message="An error occurred while fetching CAPAs." onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (!data?.items.length) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="h-64">
            <EmptyState
              icon={AlertCircle}
              title="No CAPA Records"
              description="No corrective/preventive actions currently logged."
            />
          </TableCell>
        </TableRow>
      );
    }

    return data.items.map((capa) => (
      <TableRow key={capa.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{capa.capaNumber}</TableCell>
        <TableCell>{capa.ncrNumber || capa.ncrId.substring(0, 8)}</TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{capa.title}</div>
            <div className="text-xs text-slate-500">{capa.type}</div>
          </div>
        </TableCell>
        <TableCell>{capa.ownerEmployeeName || "Owner"}</TableCell>
        <TableCell>{capa.targetDate ? new Date(capa.targetDate).toLocaleDateString() : "—"}</TableCell>
        <TableCell>
          <StatusBadge status={capa.status} />
        </TableCell>
        <TableCell className="text-right flex justify-end gap-2">
          {canVerify && capa.status !== 'Closed' && capa.status !== 'Cancelled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCapa(capa);
                setIsVerifyOpen(true);
              }}
            >
              Verify
            </Button>
          )}
          {canClose && (capa.status === 'Effective' || capa.status === 'Ineffective') && (
            <Button
              variant="default"
              size="sm"
              onClick={() => closeMutation.mutate(capa.id)}
            >
              Close
            </Button>
          )}
        </TableCell>
      </TableRow>
    ));
  }, [viewState, data, canVerify, canClose, refresh]);

  if (!canView) {
    return (
      <PageContainer>
        <ErrorView title="Access Denied" message="You do not have permission to view CAPA actions." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Corrective & Preventive Actions (CAPA)"
        description="Enterprise CAPA workflow for quality issues, root cause elimination, and verification."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            {canCreate && (
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create CAPA
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
          searchPlaceholder="Filter CAPAs by number, title, NCR..."
        />

        <div className={`rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden mt-4 transition-opacity duration-200 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900">
                <SortableHeader label="CAPA #" field="CapaNumber" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="NCR #" field="NcrId" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Title & Type" field="Title" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Owner Employee" field="OwnerEmployeeId" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
                <SortableHeader label="Target Date" field="TargetDate" currentSortBy={undefined} currentSortOrder={undefined} onSort={toggleSort} />
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

      {/* Create CAPA Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create CAPA Action</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ncrId">NCR ID *</Label>
              <Input
                id="ncrId"
                placeholder="Enter Non-Conformance Report GUID"
                value={formData.ncrId}
                onChange={(e) => setFormData({ ...formData, ncrId: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Action Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val: CapaType) => setFormData({ ...formData, type: val })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corrective">Corrective</SelectItem>
                    <SelectItem value="Preventive">Preventive</SelectItem>
                    <SelectItem value="CorrectiveAndPreventive">Corrective & Preventive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerEmployeeId">Owner Employee ID *</Label>
                <Input
                  id="ownerEmployeeId"
                  placeholder="Employee Profile GUID"
                  value={formData.ownerEmployeeId}
                  onChange={(e) => setFormData({ ...formData, ownerEmployeeId: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of CAPA action"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of action plan..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="correctiveAction">Corrective Action</Label>
                <Input
                  id="correctiveAction"
                  placeholder="Action for immediate defect"
                  value={formData.correctiveAction}
                  onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preventiveAction">Preventive Action</Label>
                <Input
                  id="preventiveAction"
                  placeholder="Action to prevent recurrence"
                  value={formData.preventiveAction}
                  onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create CAPA"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verify CAPA Modal */}
      <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify CAPA Effectiveness</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Effectiveness Result</Label>
              <Select
                value={verifyData.isEffective ? "Effective" : "Ineffective"}
                onValueChange={(val) => setVerifyData({ ...verifyData, isEffective: val === "Effective" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Effective">Effective (Passes verification)</SelectItem>
                  <SelectItem value="Ineffective">Ineffective (Requires re-action)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verification Notes</Label>
              <Textarea
                placeholder="Detailed audit / verification findings..."
                value={verifyData.verificationNotes}
                onChange={(e) => setVerifyData({ ...verifyData, verificationNotes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedCapa) {
                  verifyMutation.mutate({
                    id: selectedCapa.id,
                    isEffective: verifyData.isEffective,
                    notes: verifyData.verificationNotes
                  });
                }
              }}
              disabled={verifyMutation.isPending}
            >
              Submit Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
