import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { warrantiesApi, warrantyClaimsApi } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/ui/page-shell";
import {
  ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, Clock,
  RefreshCw, Check, X, ArrowUpRight, Search, FileText,
  Shield, UserCheck, Truck, ShoppingBag, ArrowRight
} from "lucide-react";
import { LoadingView, ErrorView } from "@/components/ui/state-views";

export function WarrantyDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [resolutionInput, setResolutionInput] = useState<string>("");

  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ["warranty", "summary"],
    queryFn: () => warrantiesApi.getSummary(),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  const approveClaimMutation = useMutation({
    mutationFn: (id: string) => warrantyClaimsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warranty", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      queryClient.invalidateQueries({ queryKey: ["warranty-claims"] });
    }
  });

  const resolveClaimMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      warrantyClaimsApi.resolve(id, resolution),
    onSuccess: () => {
      setSelectedClaimId(null);
      setResolutionInput("");
      queryClient.invalidateQueries({ queryKey: ["warranty", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      queryClient.invalidateQueries({ queryKey: ["warranty-claims"] });
    }
  });

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["warranty", "summary"] });
    queryClient.invalidateQueries({ queryKey: ["warranties"] });
    queryClient.invalidateQueries({ queryKey: ["warranty-claims"] });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingView title="Loading Warranty & Service Control Center..." />
      </PageContainer>
    );
  }

  if (isError || !summary) {
    return (
      <PageContainer>
        <ErrorView message="Failed to load Warranty Control Center data." onRetry={handleRefresh} />
      </PageContainer>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active Coverage</Badge>;
      case "Expired":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Expired</Badge>;
      case "Closed":
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">Closed</Badge>;
      case "Pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case "UnderReview":
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">Under Review</Badge>;
      case "Approved":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Approved</Badge>;
      case "Rejected":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      case "Resolved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Warranty & Service Control Center"
        description="Monitor active product coverage, handle customer claims, track serial numbers, and verify downstream sales/shipment commercial traceability."
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
        </div>
      </PageHeader>

      {/* 8 Primary Operational KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-white border-emerald-200/70 shadow-sm rounded-xl hover:border-emerald-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Active Warranties</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600">{summary.activeWarranties}</div>
            <p className="text-xs text-slate-500 mt-1">Products currently under warranty</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-amber-200/70 shadow-sm rounded-xl hover:border-amber-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700">Expiring Soon (30d)</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600">{summary.expiringWarranties}</div>
            <p className="text-xs text-slate-500 mt-1">Coverage ending within 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-blue-200/70 shadow-sm rounded-xl hover:border-blue-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-700">Active Claims</CardTitle>
            <ShieldAlert className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-600">{summary.activeClaims}</div>
            <p className="text-xs text-slate-500 mt-1">Pending, under review, or approved</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-purple-200/70 shadow-sm rounded-xl hover:border-purple-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-700">Pending Claims</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-purple-600">{summary.pendingClaims}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting initial investigation</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-cyan-200/70 shadow-sm rounded-xl hover:border-cyan-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Under Review</CardTitle>
            <Search className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-cyan-600">{summary.underReviewClaims}</div>
            <p className="text-xs text-slate-500 mt-1">Under technical evaluation</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-indigo-200/70 shadow-sm rounded-xl hover:border-indigo-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Approved Claims</CardTitle>
            <UserCheck className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-indigo-600">{summary.approvedClaims}</div>
            <p className="text-xs text-slate-500 mt-1">Claim validated & authorized</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-teal-200/70 shadow-sm rounded-xl hover:border-teal-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-teal-700">Resolved Claims</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-teal-600">{summary.resolvedClaims}</div>
            <p className="text-xs text-slate-500 mt-1">Service & repair finalized</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/70 shadow-sm rounded-xl hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-600">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-800">{summary.averageResolutionDays} <span className="text-sm font-normal text-slate-500">days</span></div>
            <p className="text-xs text-slate-500 mt-1">Time to process & resolve claim</p>
          </CardContent>
        </Card>
      </div>

      {/* Claim Stage Pipeline Visual Tracker */}
      <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
            <span>Warranty Claim Lifecycle Pipeline</span>
            <Badge variant="outline" className="font-mono text-xs">{summary.totalClaims} total claims logged</Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Real-time status breakdown across claims lifecycle stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-lg text-center">
              <span className="text-xs font-semibold text-amber-800 uppercase block mb-1">Pending</span>
              <span className="text-xl font-extrabold text-amber-600">{summary.claimPipeline["Pending"] ?? 0}</span>
            </div>
            <div className="bg-cyan-50/70 border border-cyan-200/60 p-3 rounded-lg text-center">
              <span className="text-xs font-semibold text-cyan-800 uppercase block mb-1">Under Review</span>
              <span className="text-xl font-extrabold text-cyan-600">{summary.claimPipeline["UnderReview"] ?? 0}</span>
            </div>
            <div className="bg-indigo-50/70 border border-indigo-200/60 p-3 rounded-lg text-center">
              <span className="text-xs font-semibold text-indigo-800 uppercase block mb-1">Approved</span>
              <span className="text-xl font-extrabold text-indigo-600">{summary.claimPipeline["Approved"] ?? 0}</span>
            </div>
            <div className="bg-rose-50/70 border border-rose-200/60 p-3 rounded-lg text-center">
              <span className="text-xs font-semibold text-rose-800 uppercase block mb-1">Rejected</span>
              <span className="text-xl font-extrabold text-rose-600">{summary.claimPipeline["Rejected"] ?? 0}</span>
            </div>
            <div className="bg-teal-50/70 border border-teal-200/60 p-3 rounded-lg text-center">
              <span className="text-xs font-semibold text-teal-800 uppercase block mb-1">Resolved</span>
              <span className="text-xl font-extrabold text-teal-600">{summary.claimPipeline["Resolved"] ?? 0}</span>
            </div>
            <div className="bg-slate-100/70 border border-slate-200/60 p-3 rounded-lg text-center">
              <span className="text-xs font-semibold text-slate-800 uppercase block mb-1">Closed</span>
              <span className="text-xl font-extrabold text-slate-700">{summary.claimPipeline["Closed"] ?? 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Attention Items */}
      {summary.attentionItems && summary.attentionItems.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-50/40 via-white to-orange-50/30 border-amber-200/80 shadow-sm rounded-xl mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-amber-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span>Operational Attention Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.attentionItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white/80 border border-amber-100 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{item.message}</p>
                </div>
                <Badge variant="outline" className={item.severity === "high" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                  {item.severity.toUpperCase()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Warranty Claims Queue & Expiring Warranties Queue */}
      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {/* Claims Queue */}
        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-blue-600" />
                <span>Warranty Claims Operational Queue</span>
              </span>
              <Badge variant="secondary" className="font-normal text-xs">{summary.claimQueue.length} records</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Active service requests with commercial traceability</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {summary.claimQueue.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No warranty claims currently queued.</div>
            ) : (
              <div className="space-y-4">
                {summary.claimQueue.map((claim) => (
                  <div key={claim.claimId} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{claim.productName}</span>
                          <span className="text-xs font-mono text-slate-500">[{claim.productSku}]</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3">
                          <span>S/N: <strong className="text-slate-700">{claim.serialNumber}</strong></span>
                          <span>Order: <strong className="text-slate-700">{claim.salesOrderNumber}</strong></span>
                          <span>Shipment: <strong className="text-slate-700">{claim.shipmentNumber}</strong></span>
                        </div>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700">
                      <strong>Complaint:</strong> {claim.complaint}
                      {claim.resolution && (
                        <div className="mt-1 pt-1 border-t border-slate-200 text-emerald-800">
                          <strong>Resolution:</strong> {claim.resolution}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-slate-400">
                        Customer: <span className="font-medium text-slate-600">{claim.distributorName}</span> • {new Date(claim.requestDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        {claim.status === "Pending" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                            disabled={approveClaimMutation.isPending}
                            onClick={() => approveClaimMutation.mutate(claim.claimId)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve Claim
                          </Button>
                        )}
                        {(claim.status === "Pending" || claim.status === "UnderReview" || claim.status === "Approved") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => setSelectedClaimId(claim.claimId)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon Queue */}
        <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Expiring Warranties Queue</span>
              </span>
              <Badge variant="secondary" className="font-normal text-xs">{summary.expiringQueue.length} items</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Products approaching warranty expiration</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {summary.expiringQueue.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No warranties expiring in the near window.</div>
            ) : (
              <div className="space-y-4">
                {summary.expiringQueue.map((item) => (
                  <div key={item.warrantyId} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{item.productName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          S/N: <strong className="text-slate-700">{item.serialNumber}</strong> • Type: {item.warrantyType}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                        {item.daysRemaining} days left
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      <div>Distributor: <strong>{item.distributorName}</strong></div>
                      <div>Order: <strong>{item.salesOrderNumber}</strong></div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>Expires: {new Date(item.endDate).toLocaleDateString()}</span>
                      <span className="text-slate-600 font-medium">Claims logged: {item.activeClaimCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Downstream Commercial Traceability Overview */}
      <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl mb-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-indigo-600" />
            <span>Commercial Sales & Shipment Traceability Overview</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Integrated traceability chain connecting Warranties $\rightarrow$ Products $\rightarrow$ Sales Orders $\rightarrow$ Shipments $\rightarrow$ B2B Distributors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.coverageOverview.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No warranty coverage records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Purchased Product</th>
                    <th className="py-3 px-4">Customer / Distributor</th>
                    <th className="py-3 px-4">Sales Order</th>
                    <th className="py-3 px-4">Shipment Tracking</th>
                    <th className="py-3 px-4">Coverage Dates</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.coverageOverview.map((cov) => (
                    <tr key={cov.warrantyId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{cov.serialNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{cov.productName}</div>
                        <div className="text-[10px] text-slate-400">{cov.productSku}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{cov.distributorName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{cov.salesOrderNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{cov.shipmentNumber}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(cov.startDate).toLocaleDateString()} - {new Date(cov.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(cov.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Claim Input Modal */}
      {selectedClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Resolve Warranty Claim</span>
            </h3>
            <p className="text-xs text-slate-600">
              Enter the technical repair, replacement, or service details to resolve this claim:
            </p>
            <textarea
              className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24"
              placeholder="e.g. Component replaced under warranty. Product passed functional re-test."
              value={resolutionInput}
              onChange={(e) => setResolutionInput(e.target.value)}
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedClaimId(null);
                  setResolutionInput("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!resolutionInput.trim() || resolveClaimMutation.isPending}
                onClick={() =>
                  resolveClaimMutation.mutate({
                    id: selectedClaimId,
                    resolution: resolutionInput.trim(),
                  })
                }
              >
                Save Resolution
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
