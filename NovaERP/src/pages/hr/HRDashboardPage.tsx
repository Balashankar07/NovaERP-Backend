import { useQuery } from "@tanstack/react-query";
import { hrApi } from "@/api/hr.api";
import { formatCurrency } from "@/utils/formatters";
import { Users, Building2, UserCheck, CalendarOff, FileCheck, DollarSign, RefreshCw, UserPlus, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";

export function HRDashboardPage() {
  const navigate = useNavigate();
  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ["hr-overview"],
    queryFn: async () => {
      const res = await hrApi.getOverview();
      return res.data;
    }
  });

  if (isLoading) return <LoadingView title="Loading HR & Workforce Overview..." />;
  if (isError || !overview) return <ErrorView title="Failed to load HR Overview" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="HR & Workforce Management"
        description="Personnel Profiles, Department Structure, Real-time Attendance, Leave Requests, and Financial Payroll Integration."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button size="sm" onClick={() => navigate(ROUTES.HR_EMPLOYEES)} className="gap-2">
              <UserPlus className="w-4 h-4" /> Manage Employees
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SectionCard className="p-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Workforce</p>
              <h3 className="text-2xl font-bold text-blue-950 dark:text-blue-100 mt-1">
                {overview.totalEmployees}
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                {overview.activeEmployees} Active Profiles
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-300">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Present Today</p>
              <h3 className="text-2xl font-bold text-emerald-950 dark:text-emerald-100 mt-1">
                {overview.presentToday}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                Recorded Attendances
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-300">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Pending Leave Requests</p>
              <h3 className="text-2xl font-bold text-amber-950 dark:text-amber-100 mt-1">
                {overview.pendingLeaveRequests}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {overview.onLeaveToday} On Leave Today
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-300">
              <CalendarOff className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-800/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Monthly Payroll Expense</p>
              <h3 className="text-2xl font-bold text-purple-950 dark:text-purple-100 mt-1">
                {formatCurrency(overview.monthlyPayrollExpense)}
              </h3>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                Approved & Paid
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-300">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SectionCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Departments</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Manage organizational structure, active departments, and manager assignments.
          </p>
          <Button variant="outline" className="w-full" onClick={() => navigate(ROUTES.HR_DEPARTMENTS)}>
            View Departments ({overview.totalDepartments})
          </Button>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold">Leave & Attendance</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Log daily check-ins/check-outs, record work hours, and approve leave applications.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.HR_ATTENDANCE)}>
              Attendance
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.HR_LEAVE)}>
              Leave Requests
            </Button>
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Payroll & Reports</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Process monthly payroll, post GL salary journal entries, and generate workforce reports.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.HR_PAYROLL)}>
              Payroll
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate(ROUTES.HR_REPORTS)}>
              Reports
            </Button>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
