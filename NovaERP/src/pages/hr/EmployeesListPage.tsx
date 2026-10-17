import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrApi } from "@/api/hr.api";
import { userApi } from "@/api/user.api";
import { EmployeeProfile, CreateEmployeeProfileDto, UpdateEmployeeProfileDto } from "@/types/hr.types";
import { Users, Plus, Edit2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

export function EmployeesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);

  const [createData, setCreateData] = useState<CreateEmployeeProfileDto>({
    userId: "",
    employeeCode: "",
    departmentId: "",
    designation: "",
    employmentType: "FullTime",
    dateOfJoining: new Date().toISOString().split("T")[0],
    baseSalary: 0,
    phone: "",
    address: "",
    bankName: "",
    accountNumber: "",
  });

  const [updateData, setUpdateData] = useState<UpdateEmployeeProfileDto>({
    departmentId: "",
    designation: "",
    employmentType: "FullTime",
    status: "Active",
    baseSalary: 0,
    phone: "",
    address: "",
    bankName: "",
    accountNumber: "",
  });

  const queryClient = useQueryClient();

  const { data: employeesData, isLoading, isError, refetch } = useQuery({
    queryKey: ["hr-employees", page, search, selectedDept],
    queryFn: async () => {
      const res = await hrApi.getEmployees({
        pageNumber: page,
        pageSize: 10,
        search,
        departmentId: selectedDept || undefined,
      });
      return res.data;
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["hr-departments-list"],
    queryFn: async () => {
      const res = await hrApi.getDepartments({ pageSize: 100 });
      return res.data?.items || [];
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-list-for-hr"],
    queryFn: async () => {
      const res = await userApi.getAll({ pageSize: 100 });
      // Filter out admin@novaerp.com per safety rule #1
      return (res.items || []).filter(
        (u: any) => u.email?.toLowerCase() !== "admin@novaerp.com"
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateEmployeeProfileDto) => hrApi.createEmployee(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      queryClient.invalidateQueries({ queryKey: ["hr-overview"] });
      toast.success("Employee profile created successfully");
      setIsCreateOpen(false);
      setCreateData({
        userId: "",
        employeeCode: "",
        departmentId: "",
        designation: "",
        employmentType: "FullTime",
        dateOfJoining: new Date().toISOString().split("T")[0],
        baseSalary: 0,
        phone: "",
        address: "",
        bankName: "",
        accountNumber: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create employee profile");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEmployeeProfileDto }) =>
      hrApi.updateEmployee(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      toast.success("Employee profile updated successfully");
      setEditingEmployee(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update employee profile");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.userId || !createData.employeeCode || !createData.departmentId || !createData.designation) {
      toast.warning("Please fill in all required fields");
      return;
    }
    createMutation.mutate(createData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    updateMutation.mutate({ id: editingEmployee.id, dto: updateData });
  };

  const openEditModal = (emp: EmployeeProfile) => {
    setEditingEmployee(emp);
    setUpdateData({
      departmentId: emp.departmentId,
      designation: emp.designation,
      employmentType: emp.employmentType,
      status: emp.status,
      baseSalary: emp.baseSalary,
      phone: emp.phone || "",
      address: emp.address || "",
      bankName: emp.bankName || "",
      accountNumber: emp.accountNumber || "",
    });
  };

  if (isLoading) return <LoadingView title="Loading Employee Profiles..." />;
  if (isError) return <ErrorView title="Failed to load Employee Profiles" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Employee Directory"
        description="Manage personnel records linked to authentication identities."
        actions={
          <PermissionButton
            permission="Permissions.HR.Employees.Create"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </PermissionButton>
        }
      />

      <SectionCard className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            placeholder="Search by name, code, designation..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />

          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {departmentsData?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.departmentName} ({d.departmentCode})
              </option>
            ))}
          </select>
        </div>

        {!employeesData?.items?.length ? (
          <EmptyState
            icon={Users}
            title="No Employee Profiles Found"
            description="Create an employee profile to link workforce data with system user accounts."
            action={
              <PermissionButton
                permission="Permissions.HR.Employees.Create"
                onClick={() => setIsCreateOpen(true)}
              >
                Add Employee
              </PermissionButton>
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Employment Type</TableHead>
                  <TableHead className="text-right">Base Salary</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesData.items.map((emp: EmployeeProfile) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono font-bold text-indigo-600">{emp.employeeCode}</TableCell>
                    <TableCell className="font-medium">{emp.userName}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{emp.userEmail}</TableCell>
                    <TableCell>{emp.departmentName}</TableCell>
                    <TableCell>{emp.designation}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{emp.employmentType}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      ${emp.baseSalary?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        emp.status === "Active" || emp.status === 0
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}>
                        {emp.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <PermissionButton
                        permission="Permissions.HR.Employees.Update"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(emp)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </PermissionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Create Employee Profile Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Employee Profile"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Safety Policy:</strong> Select an existing system User account to link with this profile. Super Admin (admin@novaerp.com) cannot be assigned as an employee profile.
            </div>
          </div>

          <div>
            <Label htmlFor="userId">Linked User Account *</Label>
            <select
              id="userId"
              value={createData.userId}
              onChange={(e) => setCreateData({ ...createData, userId: e.target.value })}
              className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select User Account...</option>
              {usersData?.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.username} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeCode">Employee Code *</Label>
              <Input
                id="employeeCode"
                placeholder="EMP-001"
                value={createData.employeeCode}
                onChange={(e) => setCreateData({ ...createData, employeeCode: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="departmentId">Department *</Label>
              <select
                id="departmentId"
                value={createData.departmentId}
                onChange={(e) => setCreateData({ ...createData, departmentId: e.target.value })}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Department...</option>
                {departmentsData?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.departmentName} ({d.departmentCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                placeholder="e.g. Senior Financial Analyst"
                value={createData.designation}
                onChange={(e) => setCreateData({ ...createData, designation: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <select
                id="employmentType"
                value={createData.employmentType}
                onChange={(e) => setCreateData({ ...createData, employmentType: e.target.value as any })}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="FullTime">Full Time</option>
                <option value="PartTime">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfJoining">Date of Joining *</Label>
              <Input
                id="dateOfJoining"
                type="date"
                value={createData.dateOfJoining}
                onChange={(e) => setCreateData({ ...createData, dateOfJoining: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="baseSalary">Base Salary ($) *</Label>
              <Input
                id="baseSalary"
                type="number"
                step="0.01"
                value={createData.baseSalary}
                onChange={(e) => setCreateData({ ...createData, baseSalary: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1 555-0192"
                value={createData.phone || ""}
                onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g. Chase Bank"
                value={createData.bankName || ""}
                onChange={(e) => setCreateData({ ...createData, bankName: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Profile Modal */}
      {editingEmployee && (
        <Modal
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          title={`Edit Employee Profile - ${editingEmployee.employeeCode}`}
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editDepartment">Department</Label>
                <select
                  id="editDepartment"
                  value={updateData.departmentId}
                  onChange={(e) => setUpdateData({ ...updateData, departmentId: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {departmentsData?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentName} ({d.departmentCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="editDesignation">Designation</Label>
                <Input
                  id="editDesignation"
                  value={updateData.designation}
                  onChange={(e) => setUpdateData({ ...updateData, designation: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editStatus">Employment Status</Label>
                <select
                  id="editStatus"
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value as any })}
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="OnLeave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
              <div>
                <Label htmlFor="editBaseSalary">Base Salary ($)</Label>
                <Input
                  id="editBaseSalary"
                  type="number"
                  step="0.01"
                  value={updateData.baseSalary}
                  onChange={(e) => setUpdateData({ ...updateData, baseSalary: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
