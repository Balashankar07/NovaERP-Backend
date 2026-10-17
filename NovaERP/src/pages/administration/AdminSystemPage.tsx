import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Cpu,
  Sliders,
  Info,
  Server,
  Database,
  Lock,
  Globe
} from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { AdminHealthStatus, AdminSystemConfig, AdminSystemInfo } from "@/types/admin.types";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";

export function AdminSystemPage() {
  const [healthList, setHealthList] = useState<AdminHealthStatus[]>([]);
  const [config, setConfig] = useState<AdminSystemConfig | null>(null);
  const [info, setInfo] = useState<AdminSystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hRes, cRes, iRes] = await Promise.all([
        adminApi.getSystemHealth(),
        adminApi.getSystemConfig(),
        adminApi.getSystemInfo(),
      ]);
      setHealthList(hRes);
      setConfig(cRes);
      setInfo(iRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load System Status.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingView title="Executing System Health & Environment Probe..." />;
  }

  if (error || !config || !info) {
    return <ErrorView title="Failed to load System Information" message={error || "Server error"} onRetry={loadData} />;
  }

  const getHealthBadge = (status: string) => {
    if (status === "Operational") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Operational
        </span>
      );
    }
    if (status === "Degraded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" /> Degraded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5" /> Unavailable
      </span>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="System Administration & Infrastructure"
        subtitle="Infrastructure health telemetry, non-sensitive configuration defaults, and system runtime specifications."
        actions={
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2 bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm">
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </Button>
        }
      />

      {/* Section 1: Health Telemetry */}
      <SectionCard title="1. System Health Telemetry" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {healthList.map((h) => (
            <div key={h.component} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{h.component}</span>
                <Activity className="w-4 h-4 text-slate-500" />
              </div>
              <div className="mb-2">{getHealthBadge(h.status)}</div>
              <p className="text-xs text-slate-500 mt-2">{h.details}</p>
              <div className="mt-3 text-[10px] text-slate-500 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
                <span>Latency</span>
                <span>{h.responseTimeMs} ms</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Section 2: Non-Secret Configuration */}
      <SectionCard title="2. Safe ERP System Configuration" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Environment & Locale</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Environment</span>
                <span className="font-semibold text-slate-900">{config.environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Default Currency</span>
                <span className="font-semibold text-slate-900">{config.defaultCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Zone</span>
                <span className="font-semibold text-slate-900">{config.timeZone}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Security Parameters</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Session Timeout</span>
                <span className="font-semibold text-slate-900">{config.sessionTimeoutMinutes} Mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max Failed Logins</span>
                <span className="font-semibold text-slate-900">{config.maxFailedLoginAttempts} Attempts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Audit Logging</span>
                <span className="font-semibold text-emerald-600">Enabled</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <Database className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Database Engine</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">ORM Provider</span>
                <span className="font-semibold text-slate-900">Entity Framework Core 10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-semibold text-slate-900">{config.databaseProvider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Connection Pool</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 3: System Information */}
      <SectionCard title="3. Safe Technical System Information">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-slate-500 block mb-1">Application Name</span>
            <span className="text-sm font-bold text-slate-900">{info.appName}</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-slate-500 block mb-1">Application Version</span>
            <span className="text-sm font-bold text-indigo-600 font-mono">{info.version}</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-slate-500 block mb-1">Backend Stack</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{info.backendVersion}</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-slate-500 block mb-1">Frontend Stack</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{info.frontendVersion}</span>
          </div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
