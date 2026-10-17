import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Clock,
  Layers,
  Database
} from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { AdminModuleStatus } from "@/types/admin.types";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";

export function AdminModuleStatusPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AdminModuleStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getModuleStatuses();
      setModules(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load Module Statuses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingView title="Probing Operational Module Statuses..." />;
  }

  if (error) {
    return <ErrorView title="Failed to probe Module Status" message={error} onRetry={loadData} />;
  }

  const getHealthBadge = (status: string) => {
    if (status === "Operational") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Operational
        </span>
      );
    }
    if (status === "Degraded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" /> Degraded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5" /> Unavailable
      </span>
    );
  };

  const operationalCount = modules.filter((m) => m.status === "Operational").length;

  return (
    <PageContainer>
      <PageHeader
        title="Operational Module Status"
        subtitle="Real-time health, entity record volumes, and database status across all 10 core enterprise modules."
        actions={
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm">
            <RefreshCw className="w-4 h-4" /> Run Live Probe
          </Button>
        }
      />

      {/* Overview Banner */}
      <div className="mb-6 p-5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">NovaERP Enterprise Architecture Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {operationalCount} of {modules.length} core business modules actively reporting healthy operational telemetry.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-emerald-600">{operationalCount}/{modules.length}</span>
          <span className="text-xs text-slate-500 block">Healthy Modules</span>
        </div>
      </div>

      {/* Grid of 10 Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {modules.map((mod) => (
          <div
            key={mod.moduleName}
            className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  {mod.moduleName}
                </span>
              </div>

              <div className="mb-4">{getHealthBadge(mod.status)}</div>

              <div className="space-y-2 py-3 border-t border-b border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-slate-400" /> Total Records
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{mod.recordCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Last Activity
                  </span>
                  <span className="text-slate-700 font-mono font-medium">
                    {mod.lastActivity ? new Date(mod.lastActivity).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>

              {mod.errorDetails && (
                <div className="mt-2 p-2 rounded bg-rose-500/10 text-rose-300 text-[11px] font-mono">
                  {mod.errorDetails}
                </div>
              )}
            </div>

            <div className="mt-5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(mod.route)}
                className="w-full justify-between text-xs text-indigo-600 bg-white hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300 shadow-sm"
              >
                Open {mod.moduleName} <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
