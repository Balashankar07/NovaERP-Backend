import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Shield,
  Key,
  ShieldAlert,
  Activity,
  Boxes,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink
} from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { AdminOverview, AdminModuleStatus } from "@/types/admin.types";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { ROUTES } from "@/routes";

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load Administration overview data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingView title="Loading Administration Overview..." />;
  }

  if (error || !data) {
    return <ErrorView title="Failed to load Overview" message={error || "Unable to reach server."} onRetry={loadData} />;
  }

  const getHealthBadge = (status: string) => {
    if (status === "Operational") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> Operational
        </span>
      );
    }
    if (status === "Degraded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" /> Degraded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <XCircle className="w-3.5 h-3.5" /> Unavailable
      </span>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Administration Overview"
        subtitle="Real-time control center for system accounts, RBAC, security events, module health, and infrastructure status."
        actions={
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Users */}
        <div
          onClick={() => navigate(ROUTES.ADMIN_USERS)}
          className="cursor-pointer group p-5 rounded-xl bg-card border border-border hover:border-indigo-500/50 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight">{data.totalUsers}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center justify-between">
            <span>Total Accounts</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{data.activeUsers} Active</span>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div
          onClick={() => navigate(ROUTES.ADMIN_USERS)}
          className="cursor-pointer group p-5 rounded-xl bg-card border border-border hover:border-emerald-500/50 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <UserCheck className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight">{data.activeUsers}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center justify-between">
            <span>Active Accounts</span>
            <span className="text-muted-foreground">{data.inactiveUsers} Inactive</span>
          </div>
        </div>

        {/* Card 3: Roles */}
        <div
          onClick={() => navigate(ROUTES.ADMIN_ROLES)}
          className="cursor-pointer group p-5 rounded-xl bg-card border border-border hover:border-purple-500/50 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight">{data.totalRoles}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center justify-between">
            <span>Canonical Roles</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">{data.canonicalRoles.length} Defined</span>
          </div>
        </div>

        {/* Card 4: Permissions */}
        <div
          onClick={() => navigate(ROUTES.ADMIN_PERMISSIONS)}
          className="cursor-pointer group p-5 rounded-xl bg-card border border-border hover:border-sky-500/50 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Key className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight">{data.totalPermissions}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center justify-between">
            <span>Permission Claims</span>
            <span className="text-sky-600 dark:text-sky-400 font-semibold">{Object.keys(data.permissionsByModule).length} Modules</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Canonical Roles & Permissions / Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Canonical Roles list */}
        <SectionCard title="Canonical System Roles" className="lg:col-span-1">
          <div className="space-y-2.5">
            {data.canonicalRoles.map((roleName) => {
              const count = data.roleUserCounts[roleName] || 0;
              return (
                <div
                  key={roleName}
                  onClick={() => navigate(ROUTES.ADMIN_ROLES)}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60 hover:border-border transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-foreground">{roleName}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {count} {count === 1 ? "User" : "Users"}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Security Alerts */}
        <SectionCard title="Recent Security & Access Events" className="lg:col-span-2">
          {data.recentSecurityAlerts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              No recent security anomalies or access violations recorded.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {data.recentSecurityAlerts.map((alert) => (
                <div key={alert.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 mt-0.5">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span>{alert.userIdentifier}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono">
                          {alert.action}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.details}</p>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-[11px] text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-border text-right">
            <Link to={ROUTES.ADMIN_SECURITY} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1">
              View All Security Events <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* System Health */}
      <SectionCard title="Infrastructure System Health" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {data.systemHealth.map((item) => (
            <div key={item.component} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.component}</span>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mb-2">{getHealthBadge(item.status)}</div>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.details}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Module Status List */}
      <SectionCard title="NovaERP Operational Modules Status">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.moduleStatuses.map((mod: AdminModuleStatus) => (
            <div key={mod.moduleName} className="p-4 rounded-xl bg-card border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {mod.moduleName}
                  </span>
                  {getHealthBadge(mod.status)}
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-2">
                  <span className="text-base font-bold text-foreground mr-1">{mod.recordCount.toLocaleString()}</span>
                  Records
                </div>
                {mod.lastActivity && (
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Last: {new Date(mod.lastActivity).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(mod.route)}
                  className="w-full h-8 text-xs justify-between text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border-indigo-500/20 hover:border-indigo-500/40"
                >
                  Open {mod.moduleName} <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
