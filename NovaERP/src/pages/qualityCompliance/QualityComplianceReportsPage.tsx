import { useQuery } from "@tanstack/react-query";
import { qualityComplianceApi } from "@/api/qualityCompliance.api";
import { usePermissions } from "@/hooks/use-permissions";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { FileText, AlertTriangle, CheckCircle, RefreshCw, BarChart2, ShieldCheck, Wrench, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QualityComplianceReportsPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.Quality.Reports.View");

  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ["qualityComplianceSummary"],
    queryFn: () => qualityComplianceApi.getComplianceSummary(),
    enabled: canView
  });

  if (!canView) {
    return (
      <PageContainer>
        <ErrorView title="Access Denied" message="You do not have permission to view Quality Compliance Reports." />
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingView title="Loading Quality Compliance Summary Report..." />
      </PageContainer>
    );
  }

  if (isError || !summary) {
    return (
      <PageContainer>
        <ErrorView title="Failed to Load Report" message="An error occurred while generating compliance metrics." onRetry={refetch} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Quality Compliance Reports"
        description="Persisted enterprise quality analytics: NCR metrics, CAPA status, dispositions, rework, and scrap."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh Report
          </Button>
        }
      />

      {/* High Level Key Performance Indicator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">NCR Reports</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.totalNcrs}</div>
          <div className="flex gap-4 text-xs mt-2 text-slate-500">
            <span>Open: <strong className="text-amber-600">{summary.openNcrs}</strong></span>
            <span>Closed: <strong className="text-emerald-600">{summary.closedNcrs}</strong></span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">CAPA Actions</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.totalCapas}</div>
          <div className="flex gap-4 text-xs mt-2 text-slate-500">
            <span>Open: <strong className="text-blue-600">{summary.openCapas}</strong></span>
            <span>Overdue: <strong className="text-rose-600">{summary.overdueCapas}</strong></span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Rework</span>
            <Wrench className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.completedReworkQuantity}</div>
          <div className="text-xs mt-2 text-slate-500">
            Requests: <strong>{summary.totalReworkRequests}</strong>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Stock Scrapped</span>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.totalScrapQuantity}</div>
          <div className="text-xs mt-2 text-slate-500">
            Records: <strong>{summary.totalScrapRecords}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NCR Severity Breakdown */}
        <SectionCard title="NCR Severity Breakdown">
          <div className="space-y-3">
            {Object.keys(summary.ncrsBySeverity).length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No NCR records logged.</p>
            ) : (
              Object.entries(summary.ncrsBySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{severity} Severity</span>
                  <span className="font-bold text-sm bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">{count}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Quality Dispositions Summary */}
        <SectionCard title="Quality Dispositions Summary">
          <div className="space-y-3">
            {Object.keys(summary.dispositionsByType).length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No dispositions logged.</p>
            ) : (
              Object.entries(summary.dispositionsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{type}</span>
                  <span className="font-bold text-sm bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">{count}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Defect Category Summary */}
        <SectionCard title="Defect Category Summary" className="lg:col-span-2">
          <div className="space-y-3">
            {Object.keys(summary.defectCategorySummary).length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No defects recorded.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(summary.defectCategorySummary).map(([category, count]) => (
                  <div key={category} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{category}</span>
                    <span className="font-bold text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                      {count} occurrences
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
