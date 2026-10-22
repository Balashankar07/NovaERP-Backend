import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrApi } from "@/api/hr.api";
import { LeaveRequest, CreateLeaveRequestDto, LeaveType, CreateLeaveTypeDto } from "@/types/hr.types";
import { CalendarDays, Plus, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

export function LeaveRequestsPage() {
  const [page, setPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isCreateTypeOpen, setIsCreateTypeOpen] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{ request: LeaveRequest; type: "approve" | "reject" } | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState("");

  const [requestData, setRequestData] = useState<CreateLeaveRequestDto>({
    employeeId: "",
    leaveTypeId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [typeData, setTypeData] = useState<CreateLeaveTypeDto>({
    name: "",
    description: "",
    defaultDaysPerYear: 14,
  });

  const queryClient = useQueryClient();

  const { data: requestsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["hr-leave-requests", page, selectedEmployee],
    queryFn: async () => {
      const res = await hrApi.getLeaveRequests({
        pageNumber: page,
        pageSize: 15,
        employeeId: selectedEmployee || undefined,
      });
      return res.data;
    },
  });

  const { data: leaveTypes } = useQuery({
    queryKey: ["hr-leave-types"],
    queryFn: async () => {
      const res = await hrApi.getLeaveTypes();
      return res.data || [];
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["hr-employees-leave-dropdown"],
    queryFn: async () => {
      const res = await hrApi.getEmployees({ pageSize: 100 });
      return res.data?.items || [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: (dto: CreateLeaveRequestDto) => hrApi.createLeaveRequest(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["hr-overview"] });
      toast.success("Leave request submitted successfully");
      setIsSubmitOpen(false);
      setRequestData({
        employeeId: "",
        leaveTypeId: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        reason: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit leave request");
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: (dto: CreateLeaveTypeDto) => hrApi.createLeaveType(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-leave-types"] });
      toast.success("Leave type created successfully");
      setIsCreateTypeOpen(false);
      setTypeData({ name: "", description: "", defaultDaysPerYear: 14 });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create leave type");
    },
  });

  const decisionMutation = useMutation({
    mutationFn: async () => {
      if (!decisionModal) return;
      if (decisionModal.type === "approve") {
        return hrApi.approveLeaveRequest(decisionModal.request.id, { remarks: decisionRemarks });
      } else {
        return hrApi.rejectLeaveRequest(decisionModal.request.id, { remarks: decisionRemarks });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["hr-overview"] });
      toast.success(`Leave request ${decisionModal?.type === "approve" ? "approved" : "rejected"}`);
      setDecisionModal(null);
      setDecisionRemarks("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process leave decision");
    },
  });

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestData.employeeId || !requestData.leaveTypeId || !requestData.startDate || !requestData.endDate || !requestData.reason) {
      toast.warning("Please fill in all required fields");
      return;
    }
    if (new Date(requestData.endDate) < new Date(requestData.startDate)) {
      toast.error("Leave end date cannot be earlier than start date");
      return;
    }
    submitMutation.mutate(requestData);
  };

  const handleCreateType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeData.name) {
      toast.warning("Leave type name is required");
      return;
    }
    createTypeMutation.mutate(typeData);
  };

  if (isLoading) return <LoadingView title="Loading Leave Requests..." />;
  if (isError) return <ErrorView title="Failed to load Leave Requests" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Leave Management"
        description="Process employee leave requests and configure leave entitlement types."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCreateTypeOpen(true)}>
              Manage Leave Types
            </Button>
            <PermissionButton
              permission="Permissions.HR.Leave.Apply"
              onClick={() => setIsSubmitOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Apply for Leave
            </PermissionButton>
          </div>
        }
      />

      {/* Leave Types Pill Banner */}
      <SectionCard className="p-4 mb-6 bg-slate-50 border-slate-200">
        <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Available Leave Types</div>
        <div className="flex flex-wrap gap-2">
          {leaveTypes?.map((lt: LeaveType) => (
            <span key={lt.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {lt.name} ({lt.defaultDaysPerYear} days/yr)
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={selectedEmployee}
            onChange={(e) => {
              setSelectedEmployee(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Employees</option>
            {employeesData?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.userName} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>

        {!requestsData?.items?.length ? (
          <EmptyState
            icon={CalendarDays}
            title="No Leave Requests Found"
            description="No leave applications match your criteria."
            action={
              <PermissionButton
                permission="Permissions.HR.Leave.Apply"
                onClick={() => setIsSubmitOpen(true)}
              >
                Apply for Leave
              </PermissionButton>
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-center">Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestsData.items.map((req: LeaveRequest) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      <div>{req.employeeName}</div>
                      <div className="text-xs font-mono text-slate-500">{req.employeeCode}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-indigo-700">{req.leaveTypeName}</TableCell>
                    <TableCell className="font-mono text-xs">{new Date(req.startDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs">{new Date(req.endDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center font-bold">{req.numberOfDays}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{req.reason}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        req.status === "Approved" || req.status === 2
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : req.status === "Rejected" || req.status === 3
                          ? "text-rose-700 bg-rose-50 border-rose-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}>
                        {req.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {(req.status === "PendingApproval" || req.status === "Draft" || req.status === 1 || req.status === 0) && (
                        <div className="flex justify-end gap-1">
                          <PermissionButton
                            permission="Permissions.HR.Leave.Approve"
                            variant="outline"
                            size="sm"
                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1"
                            onClick={() => setDecisionModal({ request: req, type: "approve" })}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </PermissionButton>
                          <PermissionButton
                            permission="Permissions.HR.Leave.Approve"
                            variant="outline"
                            size="sm"
                            className="text-rose-700 border-rose-300 hover:bg-rose-50 gap-1"
                            onClick={() => setDecisionModal({ request: req, type: "reject" })}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </PermissionButton>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Submit Leave Request Modal */}
      <Modal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <Label htmlFor="leaveEmployee">Employee *</Label>
            <select
              id="leaveEmployee"
              value={requestData.employeeId}
              onChange={(e) => setRequestData({ ...requestData, employeeId: e.target.value })}
              className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Employee...</option>
              {employeesData?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.userName} ({emp.employeeCode} - {emp.departmentName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="leaveTypeId">Leave Type *</Label>
            <select
              id="leaveTypeId"
              value={requestData.leaveTypeId}
              onChange={(e) => setRequestData({ ...requestData, leaveTypeId: e.target.value })}
              className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Leave Type...</option>
              {leaveTypes?.map((lt: LeaveType) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.defaultDaysPerYear} days/year)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={requestData.startDate}
                onChange={(e) => setRequestData({ ...requestData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                min={requestData.startDate}
                value={requestData.endDate}
                onChange={(e) => setRequestData({ ...requestData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Leave *</Label>
            <Input
              id="reason"
              placeholder="e.g. Annual family vacation"
              value={requestData.reason}
              onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Leave Type Modal */}
      <Modal
        isOpen={isCreateTypeOpen}
        onClose={() => setIsCreateTypeOpen(false)}
        title="Create New Leave Type"
      >
        <form onSubmit={handleCreateType} className="space-y-4">
          <div>
            <Label htmlFor="typeName">Leave Type Name *</Label>
            <Input
              id="typeName"
              placeholder="e.g. Paternity Leave"
              value={typeData.name}
              onChange={(e) => setTypeData({ ...typeData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="defaultDays">Default Days Per Year *</Label>
            <Input
              id="defaultDays"
              type="number"
              value={typeData.defaultDaysPerYear}
              onChange={(e) => setTypeData({ ...typeData, defaultDaysPerYear: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
          <div>
            <Label htmlFor="typeDescription">Description</Label>
            <Input
              id="typeDescription"
              placeholder="Policy details..."
              value={typeData.description || ""}
              onChange={(e) => setTypeData({ ...typeData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateTypeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTypeMutation.isPending}>
              {createTypeMutation.isPending ? "Creating..." : "Create Leave Type"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Decision Modal */}
      {decisionModal && (
        <Modal
          isOpen={!!decisionModal}
          onClose={() => setDecisionModal(null)}
          title={`${decisionModal.type === "approve" ? "Approve" : "Reject"} Leave Request`}
        >
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              Are you sure you want to <strong>{decisionModal.type}</strong> the leave request for <strong>{decisionModal.request.employeeName}</strong> ({decisionModal.request.leaveTypeName}, {decisionModal.request.numberOfDays} days)?
            </div>
            <div>
              <Label htmlFor="decisionRemarks">Decision Remarks / Notes</Label>
              <Input
                id="decisionRemarks"
                placeholder="Optional remarks..."
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDecisionModal(null)}>
                Cancel
              </Button>
              <Button
                variant={decisionModal.type === "approve" ? "default" : "destructive"}
                onClick={() => decisionMutation.mutate()}
                disabled={decisionMutation.isPending}
              >
                {decisionMutation.isPending ? "Processing..." : `Confirm ${decisionModal.type === "approve" ? "Approval" : "Rejection"}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
