import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrApi } from "@/api/hr.api";
import { AttendanceRecord, CreateAttendanceRecordDto } from "@/types/hr.types";
import { Clock, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

export function AttendancePage() {
  const [page, setPage] = useState(1);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  const [formData, setFormData] = useState<CreateAttendanceRecordDto>({
    employeeId: "",
    attendanceDate: new Date().toISOString().split("T")[0],
    checkIn: "09:00",
    checkOut: "17:00",
    status: "Present",
    remarks: "",
  });

  const queryClient = useQueryClient();

  const { data: attendanceData, isLoading, isError, refetch } = useQuery({
    queryKey: ["hr-attendance", page, filterDate, selectedEmployee],
    queryFn: async () => {
      const res = await hrApi.getAttendance({
        pageNumber: page,
        pageSize: 15,
        date: filterDate || undefined,
        employeeId: selectedEmployee || undefined,
      });
      return res.data;
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["hr-employees-dropdown"],
    queryFn: async () => {
      const res = await hrApi.getEmployees({ pageSize: 100 });
      return res.data?.items || [];
    },
  });

  const recordMutation = useMutation({
    mutationFn: (dto: CreateAttendanceRecordDto) => hrApi.recordAttendance(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["hr-overview"] });
      toast.success("Attendance recorded successfully");
      setIsRecordOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to record attendance");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.attendanceDate) {
      toast.warning("Employee and date are required");
      return;
    }
    if (new Date(formData.attendanceDate) > new Date()) {
      toast.error("Attendance date cannot be in the future");
      return;
    }
    recordMutation.mutate(formData);
  };

  if (isLoading) return <LoadingView title="Loading Attendance Records..." />;
  if (isError) return <ErrorView title="Failed to load Attendance Records" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Attendance & Time Tracking"
        description="Monitor daily employee check-in/check-out and total working hours."
        actions={
          <PermissionButton
            permission="Permissions.HR.Attendance.Record"
            onClick={() => setIsRecordOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Record Attendance
          </PermissionButton>
        }
      />

      <SectionCard className="p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              className="w-44"
            />
          </div>

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

          {filterDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterDate("");
                setSelectedEmployee("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {!attendanceData?.items?.length ? (
          <EmptyState
            icon={Clock}
            title="No Attendance Records Found"
            description="No logs match the selected filter criteria."
            action={
              <PermissionButton
                permission="Permissions.HR.Attendance.Record"
                onClick={() => setIsRecordOpen(true)}
              >
                Record Attendance
              </PermissionButton>
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Check In</TableHead>
                  <TableHead className="text-center">Check Out</TableHead>
                  <TableHead className="text-center">Work Hours</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.items.map((att: AttendanceRecord) => (
                  <TableRow key={att.id}>
                    <TableCell className="font-mono text-xs">{new Date(att.attendanceDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">
                      <div>{att.employeeName}</div>
                      <div className="text-xs font-mono text-slate-500">{att.employeeCode}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">{att.departmentName}</TableCell>
                    <TableCell className="text-center font-mono text-sm">{att.checkIn || "—"}</TableCell>
                    <TableCell className="text-center font-mono text-sm">{att.checkOut || "—"}</TableCell>
                    <TableCell className="text-center font-semibold">{att.workHours ? `${att.workHours} hrs` : "0 hrs"}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        att.status === "Present" || att.status === 0
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : att.status === "HalfDay" || att.status === 2
                          ? "text-amber-700 bg-amber-50 border-amber-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}>
                        {att.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{att.remarks || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Record Attendance Modal */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Attendance Log"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="recordEmployee">Employee *</Label>
            <select
              id="recordEmployee"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="attendanceDate">Attendance Date *</Label>
              <Input
                id="attendanceDate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={formData.attendanceDate}
                onChange={(e) => setFormData({ ...formData, attendanceDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="attendanceStatus">Status *</Label>
              <select
                id="attendanceStatus"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="HalfDay">Half Day</option>
                <option value="Leave">Leave</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkIn">Check In Time</Label>
              <Input
                id="checkIn"
                type="time"
                value={formData.checkIn || ""}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="checkOut">Check Out Time</Label>
              <Input
                id="checkOut"
                type="time"
                value={formData.checkOut || ""}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              placeholder="e.g. On-site audit visit"
              value={formData.remarks || ""}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={recordMutation.isPending}>
              {recordMutation.isPending ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
