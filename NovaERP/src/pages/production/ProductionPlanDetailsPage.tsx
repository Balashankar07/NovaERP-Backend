import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

import { productionApi } from "@/api/production.api";
import { ROUTES } from "@/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";

// Maps backend ProductionPlanStatus string values (serialized via .ToString()):
// Draft=1 → "Draft", Released=2 → "Released", Completed=3 → "Completed", Cancelled=4 → "Cancelled"
const getStatusBadge = (status: string | number) => {
  const s = String(status).toLowerCase();
  if (s === 'draft' || s === '1') return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
  if (s === 'released' || s === '2') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Released</Badge>;
  if (s === 'completed' || s === '3') return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
  if (s === 'cancelled' || s === '4') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

import { usePermissions } from "@/hooks/use-permissions";

export const ProductionPlanDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canRelease = hasPermission("Permissions.ProductionPlans.Release");
  const [backendShortages, setBackendShortages] = useState<any[]>([]);

  const { data: planData, isLoading: isLoadingPlan, error: planError, refetch: refetchPlan } = useQuery({
    queryKey: ["production-plan", id],
    queryFn: () => productionApi.getPlanById(id!),
    enabled: !!id,
  });

  const { data: reqData, isLoading: isLoadingReq, error: reqError, refetch: refetchReq } = useQuery({
    queryKey: ["production-plan-requirements", id],
    queryFn: () => productionApi.getPlanRequirements(id!),
    enabled: !!id,
  });

  const releaseMutation = useMutation({
    mutationFn: () => productionApi.releasePlan(id!),
    onSuccess: () => {
      toast.success("Production plan released successfully.");
      setBackendShortages([]);
      refetchPlan();
      refetchReq();
      queryClient.invalidateQueries({ queryKey: ["production-plans"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
    },
    onError: (error: any) => {
      // api-helper throws ApiError which has .message; the original ApiResponse shortages
      // were in error.response?.data?.data but are now unavailable post-unwrap.
      // Fall back to the message field from ApiError.
      toast.error(error.message || "Failed to release production plan.");
    }
  });

  const generatePrMutation = useMutation({
    mutationFn: () => productionApi.generatePr(id!),
    onSuccess: (res) => {
      toast.success(`Purchase Request ${(res as any)?.requestNumber} generated successfully`);
      queryClient.invalidateQueries({ queryKey: ["production-plan", id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate Purchase Request.");
    }
  });

  if (isLoadingPlan || isLoadingReq) return <LoadingView title="Loading details..." className="h-[60vh]" />;
  if (planError) return <ErrorView title="Error" description="Failed to load plan details." onRetry={() => refetchPlan()} />;

  const plan = planData;
  const requirements = reqData || [];

  const hasShortage = requirements.some(r => r.requiredQuantity > r.availableQuantity);
  const isDraft = String(plan?.status).toLowerCase() === '1' || String(plan?.status).toLowerCase() === 'draft';
  
  // Combine API returned shortages with client-side calculated shortages
  const displayedShortages = backendShortages.length > 0 
    ? backendShortages 
    : requirements.filter((r: any) => r.requiredQuantity > r.availableQuantity).map((r: any) => ({
        componentName: r.componentName || r.productName || 'Component',
        required: r.requiredQuantity,
        available: r.availableQuantity,
        shortage: r.requiredQuantity - r.availableQuantity
      }));

  return (
    <PageContainer className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.PRODUCTION_ORDERS)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <PageHeader
          title={plan?.planNumber || 'Production Plan'}
          description="Manage material requirements and release this plan for production."
        />
        <div className="ml-auto flex items-center gap-3">
          <Link to={ROUTES.PRODUCTION_ORDERS}>
            <Button variant="outline" className="shadow-sm">
              View Production Orders
            </Button>
          </Link>
          {getStatusBadge(plan?.status || '')}
          {isDraft && canRelease && (
            <>
              {hasShortage && (
                <Button 
                  variant="outline"
                  onClick={() => generatePrMutation.mutate()} 
                  disabled={generatePrMutation.isPending || !hasShortage}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                >
                  {generatePrMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                  Generate PR for Shortages
                </Button>
              )}
              <Button 
                onClick={() => releaseMutation.mutate()} 
                disabled={hasShortage || releaseMutation.isPending}
                className={hasShortage ? "bg-slate-300 text-slate-500 hover:bg-slate-300" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                title={hasShortage ? "Resolve material shortages before releasing production." : ""}
              >
                {releaseMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Release Production
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Info Card */}
        <SectionCard className="col-span-1 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Finished Product</p>
              <p className="font-medium text-slate-900">{plan?.productName || plan?.productId}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Planned Quantity</p>
              <p className="font-medium text-slate-900">{plan?.plannedQuantity}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Start Date</p>
              <p className="font-medium text-slate-900">{plan?.plannedStartDate ? new Date(plan?.plannedStartDate).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">End Date</p>
              <p className="font-medium text-slate-900">{plan?.plannedEndDate ? new Date(plan?.plannedEndDate).toLocaleDateString() : '-'}</p>
            </div>
          </CardContent>
        </SectionCard>

        {/* Requirements Table */}
        <SectionCard className="col-span-1 md:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Material Requirements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            
            {/* Status Banner */}
            {isDraft && (
              <div className={`p-4 border-b flex items-start gap-3 ${hasShortage || backendShortages.length > 0 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                {hasShortage || backendShortages.length > 0 ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800">Production cannot be released because required materials are insufficient.</h4>
                      <p className="text-xs text-red-600 mt-1">{displayedShortages.length} materials insufficient</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-800">All required materials are available.</h4>
                      <p className="text-xs text-emerald-600 mt-1">This plan is ready to be released for production.</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Error detail parsed from backend */}
            {backendShortages.length > 0 && (
              <div className="p-4 bg-white border-b border-red-100">
                <p className="text-sm font-semibold text-red-800 mb-3">Backend Shortage Rejection Details:</p>
                <div className="space-y-3">
                  {backendShortages.map((s, idx) => (
                    <div key={idx} className="text-sm bg-red-50 p-3 rounded-md border border-red-100 flex justify-between items-center">
                      <span className="font-medium text-red-900">{s.componentName}</span>
                      <div className="flex gap-4 text-xs text-red-700">
                        <span>Req: {s.required}</span>
                        <span>Avail: {s.available}</span>
                        <span className="font-bold">Short: {s.shortage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main BOM Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/30 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-medium">Component</th>
                    <th className="px-4 py-3 font-medium text-right">Required</th>
                    <th className="px-4 py-3 font-medium text-right">Available</th>
                    <th className="px-4 py-3 font-medium text-right">Shortage</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requirements.map((req: any, idx: number) => {
                    const compName = req.componentName || req.productName || `Component #${idx + 1}`;
                    const compCode = req.componentCode || req.productCode || '';
                    const unit = req.unit || req.unitName || 'pcs';
                    const shortage = Math.max(0, req.requiredQuantity - req.availableQuantity);
                    const isInsufficient = shortage > 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{compName}</div>
                          {compCode && <div className="text-xs text-slate-500">{compCode}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">{req.requiredQuantity} {unit}</td>
                        <td className={`px-4 py-3 text-right font-medium ${isInsufficient ? 'text-red-600' : 'text-slate-700'}`}>
                          {req.availableQuantity} {unit}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${isInsufficient ? 'text-red-600' : 'text-slate-400'}`}>
                          {shortage > 0 ? shortage : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {isInsufficient ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Insufficient</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Available</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {requirements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No material requirements found. Make sure the product has an active BOM.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </CardContent>
        </SectionCard>
      </div>
    </PageContainer>
  );
};
