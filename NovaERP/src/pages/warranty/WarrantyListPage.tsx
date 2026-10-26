import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
import { RegisterWarrantyDialog } from "./components/RegisterWarrantyDialog";
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
  X,
  Plus,
  Truck
} from "lucide-react";

export function WarrantyListPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const shipmentIdParam = searchParams.get("shipmentId");

  const [activeTab, setActiveTab] = useState<"warranties" | "claims">(
    tabParam === "warranties" || !!shipmentIdParam ? "warranties" : "claims"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaimDto | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const canView = hasPermission("Permissions.Warranties.View");
  const canCreate = hasPermission("Permissions.Warranties.Create");
  const canApprove = hasPermission("Permissions.Warranties.Approve");
  const canReject = hasPermission("Permissions.Warranties.Reject");
  const canResolve = hasPermission("Permissions.Warranties.Resolve");
  const canClose = hasPermission("Permissions.Warranties.Close");
  const canClaim = hasPermission("Permissions.Warranties.Claim");

  // Keep activeTab in sync if URL param changes
  useEffect(() => {
    if (tabParam === "warranties" || !!shipmentIdParam) {
      setActiveTab("warranties");
    } else if (tabParam === "claims") {
      setActiveTab("claims");
    }
  }, [tabParam, shipmentIdParam]);

  const handleTabChange = (tab: "warranties" | "claims") => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const clearShipmentFilter = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("shipmentId");
      return next;
    });
  };

  // Fetch Warranties List
  const {
    data: warrantiesData,
    isLoading: isWarrantiesLoading,
    isError: isWarrantiesError,
    refetch: refetchWarranties
  } = useQuery({
    queryKey: ["warranties", searchQuery],
    queryFn: () => warrantiesApi.getAll({ pageNumber: 1, pageSize: 50, search: searchQuery }),
    staleTime: 15000,
    enabled: canView
  });

  // Filter warranties when shipmentId is in URL
  const displayedWarranties = useMemo(() => {
    if (!warrantiesData?.items) return [];
    if (!shipmentIdParam) return warrantiesData.items;

    const target = shipmentIdParam.toLowerCase().trim();
    return warrantiesData.items.filter((w: any) => {
      const matchId = w.shipmentId && w.shipmentId.toLowerCase() === target;
      const matchTrk = w.trackingNumber && w.trackingNumber.toLowerCase() === target;
      return matchId || matchTrk;
    });
  }, [warrantiesData?.items, shipmentIdParam]);

  // Fetch Warranty Claims List
  const {
    data: claimsData,
    isLoading: isClaimsLoading,
    isError: isClaimsError,
    refetch: refetchClaims
  } = useQuery({
    queryKey: ["warranty-claims", searchQuery],
    queryFn: () => warrantyClaimsApi.getAll({ pageNumber: 1, pageSize: 50, search: searchQuery }),
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
        description="Operational registry for commercial product warranties, physical serial numbers, and customer claim resolutions."
      >
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs"
              onClick={() => setIsRegisterOpen(true)}
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" /> Register Warranty
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "claims"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            onClick={() => handleTabChange("claims")}
          >
            <ShieldAlert className="h-3.5 w-3.5 inline mr-1.5 text-indigo-600" />
            Warranty Claims ({claimsData?.totalCount ?? 0})
          </button>
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "warranties"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
            onClick={() => handleTabChange("warranties")}
          >
            <ShieldCheck className="h-3.5 w-3.5 inline mr-1.5 text-emerald-600" />
            Commercial Warranties ({warrantiesData?.totalCount ?? 0})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search serial, tracking #, product..."
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
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Claim ID</th>
                    <th className="py-3 px-4">Warranty Ref</th>
                    <th className="py-3 px-4">Complaint / Description</th>
                    <th className="py-3 px-4">Request Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {claimsData.items.map((claim: any) => (
                    <tr key={claim.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {claim.claimNumber || `CLM-${claim.id.substring(0, 8)}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-700 dark:text-indigo-400">
                        {claim.warrantyNumber || claim.warrantyId?.substring(0, 8) || "—"}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                        {claim.complaint || claim.issueDescription || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {claim.requestDate || claim.claimDate ? new Date(claim.requestDate || claim.claimDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {getClaimStatusBadge(claim.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canApprove && (String(claim.status) === "0" || String(claim.status).toLowerCase() === "registered" || String(claim.status).toLowerCase() === "draft") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-emerald-200 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                              disabled={approveClaimMutation.isPending}
                              onClick={() => approveClaimMutation.mutate(claim.id)}
                            >
                              <Check className="h-3 w-3 mr-1" /> Approve
                            </Button>
                          )}
                          {canReject && (String(claim.status) === "0" || String(claim.status).toLowerCase() === "registered" || String(claim.status).toLowerCase() === "underreview") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] border-rose-200 text-rose-800 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
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
                                  className="h-7 text-[11px] border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
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
                                  className="h-7 text-[11px] border-emerald-200 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
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
          {/* Active Shipment Filter Banner */}
          {shipmentIdParam && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 m-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-semibold text-indigo-950 dark:text-indigo-100">
                    Filtered by Delivered Shipment:
                  </span>{" "}
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    {displayedWarranties[0]?.trackingNumber || shipmentIdParam}
                  </span>
                  <span className="text-slate-500 ml-2">
                    ({displayedWarranties.length} linked warranty record{displayedWarranties.length !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                onClick={clearShipmentFilter}
              >
                Show All Warranties
              </Button>
            </div>
          )}

          {isWarrantiesLoading ? (
            <div className="p-8"><LoadingView title="Loading Commercial Warranties..." /></div>
          ) : isWarrantiesError ? (
            <div className="p-8"><ErrorView message="Failed to load warranties." onRetry={refetchWarranties} /></div>
          ) : shipmentIdParam && displayedWarranties.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No Commercial Warranty Registered Yet for this Shipment
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Shipment <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{shipmentIdParam}</span> was successfully delivered. Products are eligible for commercial warranty registration with legitimate serial numbers.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                {canCreate && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    onClick={() => setIsRegisterOpen(true)}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Register Warranty Now
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={clearShipmentFilter}
                >
                  Show All Warranties
                </Button>
              </div>
            </div>
          ) : !displayedWarranties?.length ? (
            <div className="p-8">
              <EmptyState
                title="No Warranties Registered"
                description="Active commercial product warranties appear here upon serial number registration for delivered shipments."
                icon={<ShieldCheck className="h-8 w-8 text-slate-400" />}
                action={
                  canCreate ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
                      onClick={() => setIsRegisterOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Register First Warranty
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Warranty ID</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Delivered Shipment</th>
                    <th className="py-3 px-4">Coverage Type</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedWarranties.map((w: any) => {
                    const isLinked = shipmentIdParam && (
                      (w.shipmentId && w.shipmentId.toLowerCase() === shipmentIdParam.toLowerCase()) ||
                      (w.trackingNumber && w.trackingNumber.toLowerCase() === shipmentIdParam.toLowerCase())
                    );
                    return (
                      <tr 
                        key={w.id} 
                        className={`transition-colors ${
                          isLinked 
                            ? "bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 border-l-4 border-l-indigo-600" 
                            : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {w.warrantyNumber || `WRN-${w.id.substring(0, 8)}`}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-indigo-700 dark:text-indigo-400">
                          {w.serialNumber || "—"}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {w.productName || w.productCode || w.productId?.substring(0, 8) || "Product"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {w.trackingNumber ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                                <Truck className="h-3 w-3 text-indigo-500" />
                                {w.trackingNumber}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px]">
                                {w.shipmentId ? `SHP-${w.shipmentId.substring(0, 8)}` : "—"}
                              </span>
                            )}
                            {isLinked && (
                              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] font-semibold">
                                Linked Shipment
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* Register Warranty Dialog */}
      <RegisterWarrantyDialog
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        defaultShipmentId={shipmentIdParam || undefined}
        onSuccess={() => refetchWarranties()}
      />
    </PageContainer>
  );
}
