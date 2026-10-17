import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrApi } from "@/api/hr.api";
import { PayrollPeriod, CreatePayrollPeriodDto, PayrollEntry } from "@/types/hr.types";
import { DollarSign, Plus, Play, CheckCircle2, CreditCard, ChevronRight, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

export function PayrollPage() {
  const [page, setPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState<CreatePayrollPeriodDto>({
    periodName: `Payroll ${new Date().toLocaleString("default", { month: "long", year: "numeric" })}`,
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
  });

  const queryClient = useQueryClient();

  const { data: periodsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["hr-payroll-periods", page],
    queryFn: async () => {
      const res = await hrApi.getPayrollPeriods({ pageNumber: page, pageSize: 10 });
      return res.data;
    },
  });

  const { data: entriesData, isLoading: isLoadingEntries } = useQuery({
    queryKey: ["hr-payroll-entries", selectedPeriod?.id],
    enabled: !!selectedPeriod?.id,
    queryFn: async () => {
      if (!selectedPeriod) return [];
      const res = await hrApi.getPayrollEntries({ periodId: selectedPeriod.id, pageSize: 100 });
      return res.data?.items || [];
    },
  });

  const createPeriodMutation = useMutation({
    mutationFn: (dto: CreatePayrollPeriodDto) => hrApi.createPayrollPeriod(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-periods"] });
      toast.success("Payroll period created successfully");
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create payroll period");
    },
  });

  const processMutation = useMutation({
    mutationFn: (periodId: string) => hrApi.processPayroll(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-periods"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-entries"] });
      queryClient.invalidateQueries({ queryKey: ["hr-overview"] });
      toast.success("Payroll entries generated and processed successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process payroll");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (periodId: string) => hrApi.approvePayrollPeriod(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-periods"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-entries"] });
      queryClient.invalidateQueries({ queryKey: ["hr-overview"] });
      toast.success("Payroll approved! Real General Ledger expense posting created in Finance.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve payroll");
    },
  });

  const payMutation = useMutation({
    mutationFn: (periodId: string) => hrApi.payPayrollPeriod(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-periods"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-entries"] });
      queryClient.invalidateQueries({ queryKey: ["hr-overview"] });
      toast.success("Payroll marked as Paid! Real GL Cash Disbursement posting executed in Finance.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to execute salary payment");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.periodName || !formData.periodStart || !formData.periodEnd) {
      toast.warning("All fields are required");
      return;
    }
    createPeriodMutation.mutate(formData);
  };

  if (isLoading) return <LoadingView title="Loading Payroll Periods..." />;
  if (isError) return <ErrorView title="Failed to load Payroll Periods" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Payroll & Compensation Management"
        description="Manage pay cycles, approve salaries, and execute real Finance GL journal entry postings."
        actions={
          <PermissionButton
            permission="Permissions.HR.Payroll.Process"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Create Pay Period
          </PermissionButton>
        }
      />

      {/* Finance Safety Info Banner */}
      <SectionCard className="p-4 mb-6 bg-indigo-50/50 border-indigo-100">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950">
            <strong>Finance Integration Active:</strong> Salary approval posts a GL Journal Entry (Debit 6000 Operating Expenses, Credit 2000 Salary Payable). Payment disbursement posts a GL Journal Entry (Debit 2000 Salary Payable, Credit 1010 Cash/Bank). No simulated payment buttons exist.
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Payroll Periods List */}
        <SectionCard className="p-4 lg:col-span-1">
          <h3 className="font-semibold text-slate-800 mb-4 px-2">Pay Periods</h3>

          {!periodsData?.items?.length ? (
            <EmptyState
              icon={DollarSign}
              title="No Payroll Periods"
              description="Create a pay period to run salary calculations."
              action={
                <PermissionButton
                  permission="Permissions.HR.Payroll.Process"
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create Pay Period
                </PermissionButton>
              }
            />
          ) : (
            <div className="space-y-2">
              {periodsData.items.map((period: PayrollPeriod) => {
                const isSelected = selectedPeriod?.id === period.id;
                return (
                  <div
                    key={period.id}
                    onClick={() => setSelectedPeriod(period)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 text-sm">{period.periodName}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-indigo-600 translate-x-0.5" : "text-slate-400"}`} />
                    </div>

                    <div className="text-xs text-slate-500 font-mono mb-2">
                      {new Date(period.periodStart).toLocaleDateString()} - {new Date(period.periodEnd).toLocaleDateString()}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        period.status === "Paid" || period.status === 3
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : period.status === "Approved" || period.status === 2
                          ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                          : period.status === "Processed" || period.status === 1
                          ? "text-blue-700 bg-blue-50 border-blue-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}>
                        {period.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        ${period.totalNetPay?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Right Column: Period Details & Entries */}
        <SectionCard className="p-6 lg:col-span-2">
          {!selectedPeriod ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <DollarSign className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p>Select a payroll period from the list to view calculation details and manage GL postings.</p>
            </div>
          ) : (
            <div>
              {/* Selected Period Header Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedPeriod.periodName}</h2>
                  <p className="text-xs font-mono text-slate-500">
                    Status: <strong className="text-indigo-700">{selectedPeriod.status}</strong> | Total Net Pay: ${selectedPeriod.totalNetPay?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(selectedPeriod.status === "Draft" || selectedPeriod.status === 0) && (
                    <PermissionButton
                      permission="Permissions.HR.Payroll.Process"
                      onClick={() => processMutation.mutate(selectedPeriod.id)}
                      disabled={processMutation.isPending}
                      className="gap-1.5"
                    >
                      <Play className="w-4 h-4" /> Process Entries
                    </PermissionButton>
                  )}

                  {(selectedPeriod.status === "Processed" || selectedPeriod.status === 1) && (
                    <PermissionButton
                      permission="Permissions.HR.Payroll.Approve"
                      onClick={() => approveMutation.mutate(selectedPeriod.id)}
                      disabled={approveMutation.isPending}
                      className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Post Expense GL
                    </PermissionButton>
                  )}

                  {(selectedPeriod.status === "Approved" || selectedPeriod.status === 2) && (
                    <PermissionButton
                      permission="Permissions.HR.Payroll.Pay"
                      onClick={() => payMutation.mutate(selectedPeriod.id)}
                      disabled={payMutation.isPending}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CreditCard className="w-4 h-4" /> Disburse & Post Cash GL
                    </PermissionButton>
                  )}
                </div>
              </div>

              {/* Entries Table */}
              <h3 className="font-semibold text-slate-800 text-sm mb-3">Employee Payroll Breakdown</h3>

              {isLoadingEntries ? (
                <LoadingView title="Loading Payroll Entries..." />
              ) : !entriesData.length ? (
                <EmptyState
                  icon={DollarSign}
                  title="No Payroll Entries Found"
                  description="Click 'Process Entries' above to calculate employee salaries for this cycle."
                />
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Base Salary</TableHead>
                        <TableHead className="text-right">Allowances</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entriesData.map((entry: PayrollEntry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            <div>{entry.employeeName}</div>
                            <div className="text-xs font-mono text-slate-500">{entry.employeeCode}</div>
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">{entry.departmentName}</TableCell>
                          <TableCell className="text-right font-mono text-sm">${entry.baseSalary?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-emerald-600">+${entry.allowances?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-rose-600">-${entry.deductions?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900">${entry.netPay?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Create Pay Period Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Payroll Period"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <Label htmlFor="periodName">Period Name *</Label>
            <Input
              id="periodName"
              placeholder="e.g. Payroll October 2026"
              value={formData.periodName}
              onChange={(e) => setFormData({ ...formData, periodName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodStart">Period Start Date *</Label>
              <Input
                id="periodStart"
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="periodEnd">Period End Date *</Label>
              <Input
                id="periodEnd"
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPeriodMutation.isPending}>
              {createPeriodMutation.isPending ? "Creating..." : "Create Pay Period"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
