import { useState, useEffect } from "react";
import {
  ShieldAlert,
  UserCheck,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { AdminSecurityData, AdminSecurityAlert } from "@/types/admin.types";
import { AuditLog } from "@/types";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AdminSecurityPage() {
  const [data, setData] = useState<AdminSecurityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"LOGIN" | "FAILED" | "AUTH">("LOGIN");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSecurityOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load Security logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingView title="Loading Security Activity & Events..." />;
  }

  if (error || !data) {
    return <ErrorView title="Failed to load Security Events" message={error || "Server error"} onRetry={loadData} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Security & Access Control Activity"
        subtitle="Immutable record of user authentication events, invalid login attempts, and policy authorization decisions."
        actions={
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh Events
          </Button>
        }
      />

      {/* Security Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          onClick={() => setActiveTab("LOGIN")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "LOGIN"
              ? "bg-card border-indigo-500/50 shadow-indigo-500/10 shadow-md ring-1 ring-indigo-500/20"
              : "bg-card/40 border-border/60 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Successful Logins</span>
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{data.loginActivity.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Recorded successful user sessions</p>
        </div>

        <div
          onClick={() => setActiveTab("FAILED")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "FAILED"
              ? "bg-card border-rose-500/50 shadow-rose-500/10 shadow-md ring-1 ring-rose-500/20"
              : "bg-card/40 border-border/60 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Failed Attempts</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{data.failedAttempts.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Authentication failures & invalid logins</p>
        </div>

        <div
          onClick={() => setActiveTab("AUTH")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "AUTH"
              ? "bg-card border-amber-500/50 shadow-amber-500/10 shadow-md ring-1 ring-amber-500/20"
              : "bg-card/40 border-border/60 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Authorization Denied</span>
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{data.authorizationEvents.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Permission denied / 403 Forbidden checks</p>
        </div>
      </div>

      {/* Tab 1: Successful Login Activity */}
      {activeTab === "LOGIN" && (
        <SectionCard title="Successful Account Logins">
          {data.loginActivity.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No recent login events recorded.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User Identifier</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.loginActivity.map((log: AuditLog) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{log.userEmail || "User"}</TableCell>
                    <TableCell className="font-mono text-xs text-emerald-600 dark:text-emerald-400">{log.action}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress || "127.0.0.1"}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Success
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      )}

      {/* Tab 2: Failed Login Attempts */}
      {activeTab === "FAILED" && (
        <SectionCard title="Failed Login & Authentication Anomaly Attempts">
          {data.failedAttempts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              Zero authentication failure events recorded.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Attempted User / Email</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Details / Failure Reason</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.failedAttempts.map((event: AdminSecurityAlert) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-rose-600 dark:text-rose-400">{event.userIdentifier}</TableCell>
                    <TableCell className="font-mono text-xs text-rose-600 dark:text-rose-400">{event.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{event.details}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{event.ipAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      )}

      {/* Tab 3: Authorization Denied Events */}
      {activeTab === "AUTH" && (
        <SectionCard title="Authorization & Permission Denied (403) Events">
          {data.authorizationEvents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              Zero permission-denied events recorded.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Action Requested</TableHead>
                  <TableHead>Endpoint / Permission</TableHead>
                  <TableHead className="text-right">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.authorizationEvents.map((event: AdminSecurityAlert) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{event.userIdentifier}</TableCell>
                    <TableCell className="font-mono text-xs text-amber-600 dark:text-amber-400">{event.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{event.details}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <Lock className="w-3 h-3" /> Forbidden
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      )}
    </PageContainer>
  );
}
