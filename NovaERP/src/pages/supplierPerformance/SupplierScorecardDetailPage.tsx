import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supplierPerformanceApi } from '@/api/supplierPerformance.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Award, 
  Clock, 
  PackageCheck, 
  ShieldCheck, 
  CircleDollarSign, 
  Info,
  Calendar,
  Building2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const SupplierScorecardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: scorecard, isLoading: isScorecardLoading, isError, refetch } = useQuery({
    queryKey: ['supplier-scorecard', id],
    queryFn: () => supplierPerformanceApi.getScorecardDetail(id!),
    enabled: !!id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['supplier-history', id],
    queryFn: () => supplierPerformanceApi.getMonthlyHistory(id!, 6),
    enabled: !!id,
  });

  if (isScorecardLoading) return <LoadingView title="Calculating Vendor Scorecard..." />;
  if (isError || !scorecard) return <ErrorView title="Failed to load vendor scorecard" onRetry={refetch} />;

  const summary = scorecard.summary;

  const getGradeBadge = (grade: string) => {
    if (grade.startsWith('Grade A')) return <Badge className="bg-emerald-600 text-white font-bold text-sm px-3 py-1">Grade A - Excellent</Badge>;
    if (grade.startsWith('Grade B')) return <Badge className="bg-blue-600 text-white font-bold text-sm px-3 py-1">Grade B - Good</Badge>;
    if (grade.startsWith('Grade C')) return <Badge className="bg-amber-600 text-white font-bold text-sm px-3 py-1">Grade C - Satisfactory</Badge>;
    if (grade.startsWith('Grade D')) return <Badge className="bg-rose-600 text-white font-bold text-sm px-3 py-1">Grade D - Needs Attention</Badge>;
    return <Badge variant="outline" className="text-slate-500 border-slate-300 font-semibold px-3 py-1">INSUFFICIENT DATA</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/suppliers/performance/list')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Vendor List
        </Button>
      </div>

      <PageHeader
        title={`Supplier Scorecard: ${summary.supplierName}`}
        description={`Code: ${summary.supplierCode} | Contact: ${summary.contactPerson || 'N/A'} (${summary.email || 'No email'})`}
        actions={
          <div className="flex items-center gap-3">
            {getGradeBadge(summary.grade)}
            {summary.finalScore !== undefined && summary.finalScore !== null && (
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border">
                {summary.finalScore.toFixed(1)} / 100
              </div>
            )}
          </div>
        }
      />

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" /> On-Time Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {summary.onTimeDeliveryRate !== undefined && summary.onTimeDeliveryRate !== null ? `${summary.onTimeDeliveryRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Late Deliveries: {summary.lateDeliveryCount} | Avg Delay: {summary.averageDelayDays ?? 0} days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4 text-emerald-600" /> Fulfillment Fill Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">
              {summary.fillRate !== undefined && summary.fillRate !== null ? `${summary.fillRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              Received: {summary.totalReceivedQuantity} / Ordered: {summary.totalOrderedQuantity}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-purple-600" /> Quality Acceptance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {summary.qualityAcceptanceRate !== undefined && summary.qualityAcceptanceRate !== null ? `${summary.qualityAcceptanceRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-purple-700 mt-1">
              Accepted: {summary.totalAcceptedQuantity} | Rejected: {summary.totalRejectedQuantity}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <CircleDollarSign className="h-4 w-4 text-amber-600" /> Total PO Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              ${summary.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-amber-700 mt-1">
              POs: {summary.totalPOCount} | GRNs: {summary.totalGRNCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transparent Metric Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" /> Transparent Score Breakdown & Formulation
          </CardTitle>
          <CardDescription>{scorecard.formulaExplanation}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3">Category / Metric</th>
                  <th className="px-6 py-3">Raw Value</th>
                  <th className="px-6 py-3">Normalized Score (0-100)</th>
                  <th className="px-6 py-3">Configured Weight</th>
                  <th className="px-6 py-3">Weighted Contribution</th>
                  <th className="px-6 py-3">Data Coverage</th>
                  <th className="px-6 py-3">Formula Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scorecard.metricsBreakdown.map((m, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{m.metricName}</div>
                      <div className="text-xs text-muted-foreground">{m.metricCategory}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {m.rawValueFormatted}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {m.normalizedScore !== undefined && m.normalizedScore !== null ? `${m.normalizedScore.toFixed(1)} / 100` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-indigo-600">
                      {m.weightPercent}%
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                      {m.weightedContribution !== undefined && m.weightedContribution !== null ? `+${m.weightedContribution.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <Badge variant={m.dataCoverage === 'AVAILABLE' ? 'outline' : 'secondary'}>
                        {m.dataCoverage}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs">
                      {m.formulaDescription}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" /> Historical Performance (Last {history.length} Months)
            </CardTitle>
            <CardDescription>Monthly trends computed directly from historical PO and GRN transactions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3">Month</th>
                    <th className="px-6 py-3">POs</th>
                    <th className="px-6 py-3">GRNs</th>
                    <th className="px-6 py-3">Purchase Spend</th>
                    <th className="px-6 py-3">Ordered Qty</th>
                    <th className="px-6 py-3">Received Qty</th>
                    <th className="px-6 py-3">On-Time %</th>
                    <th className="px-6 py-3">Fill Rate %</th>
                    <th className="px-6 py-3">Quality %</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((h, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{h.monthName}</td>
                      <td className="px-6 py-4 font-mono">{h.poCount}</td>
                      <td className="px-6 py-4 font-mono">{h.grnCount}</td>
                      <td className="px-6 py-4 font-mono font-semibold">${h.purchaseValue.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono">{h.orderedQuantity}</td>
                      <td className="px-6 py-4 font-mono">{h.receivedQuantity}</td>
                      <td className="px-6 py-4 font-bold text-blue-600">{h.onTimeDeliveryRate !== null ? `${h.onTimeDeliveryRate}%` : '—'}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{h.fillRate !== null ? `${h.fillRate}%` : '—'}</td>
                      <td className="px-6 py-4 font-bold text-purple-600">{h.qualityAcceptanceRate !== null ? `${h.qualityAcceptanceRate}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
