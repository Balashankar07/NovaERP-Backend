import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qualityComplianceApi } from "@/api/qualityCompliance.api";
import { NcrStatus, NcrSeverity } from "@/types/qualityCompliance.types";
import { usePermissions } from "@/hooks/use-permissions";
import { ArrowLeft, Save, CheckCircle, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function NCRDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canUpdate = hasPermission("Permissions.Quality.NCR.Update");
  const canClose = hasPermission("Permissions.Quality.NCR.Close");

  const { data: ncr, isLoading, isError, refetch } = useQuery({
    queryKey: ["ncr", id],
    queryFn: () => qualityComplianceApi.getNcrById(id!),
    enabled: !!id
  });

  const [editData, setEditData] = useState({
    severity: "Minor" as NcrSeverity,
    category: "",
    description: "",
    containmentAction: "",
    rootCauseCategory: "",
    rootCauseDescription: "",
    correctiveAction: "",
    preventiveAction: "",
  });

  const [closureRemarks, setClosureRemarks] = useState("");
  const [targetStatus, setTargetStatus] = useState<NcrStatus>("Closed");

  // Sync state once loaded
  useEffect(() => {
    if (ncr) {
      setEditData({
        severity: (ncr.severity as NcrSeverity) || "Minor",
        category: ncr.category || "",
        description: ncr.description || "",
        containmentAction: ncr.containmentAction || "",
        rootCauseCategory: ncr.rootCauseCategory || "",
        rootCauseDescription: ncr.rootCauseDescription || "",
        correctiveAction: ncr.correctiveAction || "",
        preventiveAction: ncr.preventiveAction || "",
      });
    }
  }, [ncr]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof editData) => qualityComplianceApi.updateNcr(id!, data),
    onSuccess: () => {
      toast.success("NCR updated successfully");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update NCR");
    }
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { status: NcrStatus; closureRemarks?: string }) =>
      qualityComplianceApi.updateNcrStatus(id!, payload.status, payload.closureRemarks),
    onSuccess: () => {
      toast.success("NCR status updated successfully");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["qualityCompliance"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to update status");
    }
  });

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingView title="Loading NCR Details..." />
      </PageContainer>
    );
  }

  if (isError || !ncr) {
    return (
      <PageContainer>
        <ErrorView title="NCR Not Found" message="Could not find the requested Non-Conformance Report." onRetry={refetch} />
      </PageContainer>
    );
  }

  const isClosed = ncr.status === "Closed" || ncr.status === "Cancelled";

  return (
    <PageContainer>
      <PageHeader
        title={`NCR: ${ncr.ncrNumber}`}
        description={`Quality non-conformance report for ${ncr.productName} (${ncr.productCode})`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/quality-compliance/ncrs")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to NCRs
            </Button>
            {!isClosed && canUpdate && (
              <Button size="sm" onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-1" /> Save Investigation
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details & Manual Root Cause Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Report Overview">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-slate-500">Inspection Number</Label>
                <p className="font-medium text-slate-900 dark:text-slate-100">{ncr.qualityInspectionNumber}</p>
              </div>
              <div>
                <Label className="text-slate-500">Severity</Label>
                <p className="font-medium">{ncr.severity}</p>
              </div>
              <div>
                <Label className="text-slate-500">Category</Label>
                <p className="font-medium">{ncr.category}</p>
              </div>
              <div>
                <Label className="text-slate-500">Detected Date</Label>
                <p className="font-medium">{new Date(ncr.detectedDate).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-slate-500">Reported By</Label>
                <p className="font-medium">{ncr.reportedByUserName}</p>
              </div>
              <div>
                <Label className="text-slate-500">Assigned To</Label>
                <p className="font-medium">{ncr.assignedToUserName || "Unassigned"}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Label className="text-slate-500">Description</Label>
              <p className="mt-1 text-slate-800 dark:text-slate-200">{ncr.description}</p>
            </div>
          </SectionCard>

          {/* Root Cause & Corrective Actions Form */}
          <SectionCard title="Root Cause & Investigation (Structured Manual)">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity Level</Label>
                  <Select
                    disabled={isClosed || !canUpdate}
                    value={editData.severity}
                    onValueChange={(val: NcrSeverity) => setEditData({ ...editData, severity: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Minor">Minor</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Root Cause Category</Label>
                  <Input
                    disabled={isClosed || !canUpdate}
                    placeholder="e.g., Tooling Wear, Operator Error, Raw Material Defect"
                    value={editData.rootCauseCategory}
                    onChange={(e) => setEditData({ ...editData, rootCauseCategory: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Immediate Containment Action</Label>
                <Textarea
                  disabled={isClosed || !canUpdate}
                  placeholder="Quarantine steps taken..."
                  value={editData.containmentAction}
                  onChange={(e) => setEditData({ ...editData, containmentAction: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Root Cause Investigation Details</Label>
                <Textarea
                  disabled={isClosed || !canUpdate}
                  placeholder="Manual root-cause analysis findings..."
                  value={editData.rootCauseDescription}
                  onChange={(e) => setEditData({ ...editData, rootCauseDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Corrective Action</Label>
                  <Textarea
                    disabled={isClosed || !canUpdate}
                    placeholder="Steps to correct current non-conformance..."
                    value={editData.correctiveAction}
                    onChange={(e) => setEditData({ ...editData, correctiveAction: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preventive Action</Label>
                  <Textarea
                    disabled={isClosed || !canUpdate}
                    placeholder="Steps to prevent recurrence..."
                    value={editData.preventiveAction}
                    onChange={(e) => setEditData({ ...editData, preventiveAction: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Sidebar Status & Lifecycle Actions */}
        <div className="space-y-6">
          <SectionCard title="Lifecycle & Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <span className="text-sm font-medium text-slate-500">Current Status</span>
                <StatusBadge status={ncr.status} />
              </div>

              {ncr.closedDate && (
                <div className="text-xs text-slate-500">
                  <span>Closed on: </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(ncr.closedDate).toLocaleString()}
                  </span>
                </div>
              )}

              {ncr.closureRemarks && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md text-xs">
                  <span className="font-semibold block mb-1">Closure Remarks:</span>
                  <p className="text-slate-600 dark:text-slate-300">{ncr.closureRemarks}</p>
                </div>
              )}

              {!isClosed && canClose && (
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Label>Change Status</Label>
                  <Select
                    value={targetStatus}
                    onValueChange={(val: NcrStatus) => setTargetStatus(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UnderInvestigation">Under Investigation</SelectItem>
                      <SelectItem value="DispositionPending">Disposition Pending</SelectItem>
                      <SelectItem value="ActionPending">Action Pending</SelectItem>
                      <SelectItem value="VerificationPending">Verification Pending</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Closure / status transition remarks..."
                    value={closureRemarks}
                    onChange={(e) => setClosureRemarks(e.target.value)}
                    rows={2}
                  />

                  <Button
                    className="w-full"
                    onClick={() => statusMutation.mutate({ status: targetStatus, closureRemarks })}
                    disabled={statusMutation.isPending}
                  >
                    Update Status to {targetStatus}
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}
