import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warrantiesApi, warrantyClaimsApi } from "@/api/warranties.api";
import { WarrantyDto, WarrantyClaimDto } from "@/api/warranties.api";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Layers,
  Filter,
  Eye,
  Check,
  X
} from "lucide-react";

export function WarrantyListPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<"warranties" | "claims">("claims");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaimDto | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  const canView = hasPermission("Permissions.Warranties.View");
  const canApprove = hasPermission("Permissions.Warranties.Approve");
  const canReject = hasPermission("Permissions.Warranties.Reject");
  const canResolve = hasPermission("Permissions.Warranties.Resolve");
  const canClose = hasPermission("Permissions.Warranties.Close");
  const canClaim = hasPermission("Permissions.Warranties.Claim");

  // Fetch Warranties List
  const {
    data: warrantiesData,
    isLoading: isWarrantiesLoading,
    isError: isWarrantiesError,
    refetch: refetchWarranties
  } = useQuery({
    queryKey: ["warranties", searchQuery],
    queryFn: () => warrantiesApi.getAll({ pageNumber: 1, pageSize: 20, search: searchQuery }),
    staleTime: 15000,
    enabled: canView
  });

  // Fetch Warranty Claims List
  const {
    data: claimsData,
    isLoading: isClaimsLoading,
    isError: isClaimsError,
    refetch: refetchClaims
  } = useQuery({
    queryKey: ["warranty-claims", searchQuery],
    queryFn: () => warrantyClaimsApi.getAll({ pageNumber: 1, pageSize: 20, search: searchQuery }),
    staleTime: 15000,
    enabled: canView
  });

  const approveClaimMutation = useMutation({
    mutationFn: (id: string) => warrantyClaimsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty-claims"] });
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      queryClient.invalidateQueries({ queryKey: ["warranty", "summary"] });
    }
  });

  const rejectClaimMutation = useMutation({
    mutationFn: (id: string) => warrantyClaimsApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty-claims"] });
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      queryClient.invalidateQueries({ queryKey: ["warranty", "summary"] });
    }
  });

  const resolveClaimMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      warrantyClaimsApi.resolve(id, resolution),
    onSuccess: () => {
      setSelectedClaim(null);
      setResolutionText("");
      queryClient.invalidateQueries({ queryKey: ["warranty-claims"] });
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      queryClient.invalidateQueries({ queryKey: ["warranty", "summary"] });
    }
  });

  const closeClaimMutation = useMutation({
    mutationFn: (id: string) => warrantyClaimsApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty-claims"] });
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      queryClient.invalidateQueries({ queryKey: ["warranty", "summary"] });
    }
  });

  const handleRefresh = () => {
    refetchWarranties();
    refetchClaims();
  };

  const getWarrantyStatusBadge = (status: string | number) => {
    const sStr = String(status).toLowerCase();
    if (sStr === "0" || sStr === "active") {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>;
    }
    if (sStr === "1" || sStr === "expiringsoon") {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Expiring Soon</Badge>;
    }
    if (sStr === "2" || sStr === "expired") {
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Expired</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getClaimStatusBadge = (status: string | number) => {
    const sStr = String(status).toLowerCase();
    if (sStr === "0" || sStr === "registered" || sStr === "draft") {
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Registered</Badge>;
    }
    if (sStr === "1" || sStr === "underreview" || sStr === "pending") {
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Under Review</Badge>;
    }
    if (sStr === "2" || sStr === "approved") {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Approved</Badge>;
    }
    if (sStr === "3" || sStr === "rejected") {
      return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">Rejected</Badge>;
    }
    if (sStr === "4" || sStr === "resolved") {
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Resolved</Badge>;
    }
    if (sStr === "5" || sStr === "closed") {
      return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300">Closed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (!canView) {
    return (
      <PageContainer>
        <ErrorView title="Access Denied" description="You do not have permission to view warranty management data." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Warranty & Claims Management"
        description="Comprehensive operational registry for customer warranties, serial numbers, and claim resolutions."
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "claims"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("claims")}
          >
            <ShieldAlert className="h-3.5 w-3.5 inline mr-1.5 text-indigo-600" />
            Warranty Claims ({claimsData?.totalCount ?? 0})
          </button>
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "warranties"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("warranties")}
          >
            <ShieldCheck className="h-3.5 w-3.5 inline mr-1.5 text-emerald-600" />
            Commercial Warranties ({warrantiesData?.totalCount ?? 0})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by serial, order #, or claim..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === "claims" ? (
        <SectionCard className="p-0">
          {isClaimsLoading ? (
            <div className="p-8"><LoadingView title="Loading Warranty Claims..." /></div>
          ) : isClaimsError ? (
            <div className="p-8"><ErrorView message="Failed to load warranty claims." onRetry={refetchClaims} /></div>
          ) : !claimsData?.items?.length ? (
            <div className="p-8">
              <EmptyState
                title="No Warranty Claims Found"
                description="No active customer warranty claims recorded."
                icon={<ShieldAlert className="h-8 w-8 text-slate-400" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Claim ID</th>
                    <th className="py-3 px-4">Warranty Ref</th>
                    <th className="py-3 px-4">Complaint / Description</th>
                    <th className="py-3 px-4">Request Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claimsData.items.map((claim: any) => (
                    <tr key={claim.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {claim.claimNumber || `CLM-${claim.id.substring(0, 8)}`}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {claim.warrantyNumber || claim.warrantyId?.substring(0, 8) || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {claim.complaint || claim.issueDescription || "No complaint detail"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {claim.requestDate || claim.claimDate ? new Date(claim.requestDate || claim.claimDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4">{getClaimStatusBadge(claim.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canApprove && (String(claim.status) === "0" || String(claim.status).toLowerCase() === "registered" || String(claim.status) === "1" || String(claim.status).toLowerCase() === "pending") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-amber-200 text-amber-800 hover:bg-amber-50"
                              disabled={approveClaimMutation.isPending}
                              onClick={() => approveClaimMutation.mutate(claim.id)}
                            >
                              <Check className="h-3 w-3 mr-1" /> Approve
                            </Button>
                          )}
                          {canReject && (String(claim.status) === "0" || String(claim.status).toLowerCase() === "registered" || String(claim.status) === "1" || String(claim.status).toLowerCase() === "pending") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-rose-200 text-rose-800 hover:bg-rose-50"
                              disabled={rejectClaimMutation.isPending}
                              onClick={() => rejectClaimMutation.mutate(claim.id)}
                            >
                              <X className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          )}
                          {selectedClaim?.id === claim.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                placeholder="Resolution notes..."
                                value={resolutionText}
                                onChange={(e) => setResolutionText(e.target.value)}
                                className="h-7 text-[11px] w-36"
                              />
                              <Button
                                size="sm"
                                className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={resolveClaimMutation.isPending || !resolutionText.trim()}
                                onClick={() => resolveClaimMutation.mutate({ id: claim.id, resolution: resolutionText })}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => setSelectedClaim(null)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              {canResolve && String(claim.status) !== "4" && String(claim.status).toLowerCase() !== "resolved" && String(claim.status) !== "5" && String(claim.status).toLowerCase() !== "closed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                  onClick={() => {
                                    setSelectedClaim(claim);
                                    setResolutionText(claim.resolution || "");
                                  }}
                                >
                                  Resolve
                                </Button>
                              )}
                              {canResolve && (String(claim.status) === "4" || String(claim.status).toLowerCase() === "resolved") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                                  disabled={closeClaimMutation.isPending}
                                  onClick={() => closeClaimMutation.mutate(claim.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Close Claim
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      ) : (
        <SectionCard className="p-0">
          {isWarrantiesLoading ? (
            <div className="p-8"><LoadingView title="Loading Commercial Warranties..." /></div>
          ) : isWarrantiesError ? (
            <div className="p-8"><ErrorView message="Failed to load warranties." onRetry={refetchWarranties} /></div>
          ) : !warrantiesData?.items?.length ? (
            <div className="p-8">
              <EmptyState
                title="No Warranties Registered"
                description="Active commercial product warranties will appear here upon shipment fulfillment."
                icon={<ShieldCheck className="h-8 w-8 text-slate-400" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Warranty ID</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Coverage Type</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warrantiesData.items.map((w: any) => (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {w.warrantyNumber || `WRN-${w.id.substring(0, 8)}`}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-indigo-700">
                        {w.serialNumber || "—"}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {w.productName || w.productCode || w.productId?.substring(0, 8) || "Product"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {w.warrantyType || "Standard Commercial"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {w.startDate ? new Date(w.startDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {w.endDate ? new Date(w.endDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4">{getWarrantyStatusBadge(w.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}
    </PageContainer>
  );
}
