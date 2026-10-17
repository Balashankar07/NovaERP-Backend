import { useQuery } from "@tanstack/react-query";
import { hrApi } from "@/api/hr.api";
import { BarChart3, Building2, Clock, DollarSign } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";

export function HRReportsPage() {
  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ["hr-reports-summary"],
    queryFn: async () => {
      const res = await hrApi.getReportsSummary();
      return res.data;
    },
  });

  if (isLoading) return <LoadingView title="Loading HR Analytics & Reports..." />;
  if (isError) return <ErrorView title="Failed to load HR Analytics" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="HR Analytics & Reports"
        description="Comprehensive summary reports across department headcounts, attendance tracking, and payroll."
      />

      <div className="space-y-6">
        {/* Department Headcount Report */}
        <SectionCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Department Headcount & Payroll Allocation</h3>
          </div>

          {!summary?.departmentHeadcounts?.length ? (
            <EmptyState icon={BarChart3} title="No Department Data" description="No active departments found." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Employee Count</TableHead>
                    <TableHead className="text-right">Total Base Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.departmentHeadcounts.map((dept, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-slate-900">{dept.departmentName}</TableCell>
                      <TableCell className="text-center font-bold">{dept.employeeCount}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        ${dept.totalBaseSalary?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>

        {/* Attendance Summary */}
        <SectionCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Attendance Breakdown</h3>
          </div>

          {!summary?.attendanceSummary?.length ? (
            <EmptyState icon={Clock} title="No Attendance Logs" description="No attendance records available." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {summary.attendanceSummary.map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="text-xs font-semibold text-slate-500 uppercase">{item.status}</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Payroll Cycles Summary */}
        <SectionCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Historical Payroll Cycles</h3>
          </div>

          {!summary?.payrollSummary?.length ? (
            <EmptyState icon={DollarSign} title="No Payroll Cycles" description="No payroll cycles have been executed." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pay Period</TableHead>
                    <TableHead className="text-right">Total Gross Pay</TableHead>
                    <TableHead className="text-right">Total Net Pay</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.payrollSummary.map((pay, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold">{pay.periodName}</TableCell>
                      <TableCell className="text-right font-mono">${pay.totalGrossPay?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono font-bold">${pay.totalNetPay?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {pay.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}
