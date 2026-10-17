import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productionOperationsApi } from '@/api/productionOperations.api';
import { usePermissions } from '@/hooks/use-permissions';
import { Factory, Cpu, GitFork, Users, Calendar, AlertTriangle, RefreshCw, BarChart2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const ProductionOperationsReportsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canView = hasPermission('Permissions.Production.Reports.View');

  const { data: response, isLoading, refetch, error } = useQuery({
    queryKey: ['production-operations-summary-report'],
    queryFn: () => productionOperationsApi.getSummaryReport(),
    enabled: canView,
  });

  // Map correctly to backend DTO fields (ProductionOperationsSummaryDto)
  const summary = response as any; 

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-600" />
            Advanced Manufacturing Operations Report
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Empirical shop-floor analytics derived exclusively from live database records. No AI/predictive fallbacks.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          className="gap-2"
          disabled={!canView}
        >
          <RefreshCw className="h-4 w-4" /> Refresh Report
        </Button>
      </div>

      {!canView ? (
        <Card className="p-16 text-center border-rose-200/60 bg-rose-50/30 dark:border-rose-900/30 dark:bg-rose-950/20 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 mb-6">
            <ShieldAlert className="h-8 w-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Access Restricted</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            You do not have the required permissions to view production operation analytics. Please contact your system administrator to request access.
          </p>
        </Card>
      ) : isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Compiling operations report...</p>
        </div>
      ) : error || !summary ? (
        <Card className="p-16 text-center border-slate-200 dark:border-slate-800 border-dashed">
          <AlertTriangle className="h-10 w-10 text-slate-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">Report Data Unavailable</h3>
          <p className="text-sm text-slate-500">
            We encountered an issue while loading the report summary. Please try refreshing.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">Work Centers</CardTitle>
                <Factory className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalWorkCenters || 0}</div>
                <p className="text-xs text-slate-500 mt-1">Total manufacturing areas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">Machine Registry</CardTitle>
                <Cpu className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.activeMachines || 0} Active</div>
                <p className="text-xs text-slate-500 mt-1">{summary.maintenanceMachines || 0} in maintenance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">Jobs & Scheduling</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.scheduledOrders || 0} Scheduled</div>
                <p className="text-xs text-slate-500 mt-1">{summary.inProgressSchedules || 0} active in progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">Downtime Events</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.downtimeEventsCount || 0} Logged</div>
                <p className="text-xs text-slate-500 mt-1">{summary.activeWorkerAssignments || 0} active worker shifts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b bg-slate-50 dark:bg-slate-900/50">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-600" />
                Machine Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!summary.machineStatusBreakdown || summary.machineStatusBreakdown.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-500">No machine data available.</p>
              ) : (
                <div className="divide-y text-sm">
                  {summary.machineStatusBreakdown.map((machine: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {machine.machineCode}
                          </Badge>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{machine.machineName}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Events Logged: {machine.eventsLoggedCount}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={machine.status === 'Running' || machine.status === 'Available' ? 'default' : 'secondary'} className={machine.status === 'Maintenance' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}>
                          {machine.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
