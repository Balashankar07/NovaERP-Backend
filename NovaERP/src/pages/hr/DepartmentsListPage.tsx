import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrApi } from "@/api/hr.api";
import { Department, CreateDepartmentDto } from "@/types/hr.types";
import { Building2, Plus, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

export function DepartmentsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateDepartmentDto>({
    departmentCode: "",
    departmentName: "",
    description: "",
  });

  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hr-departments", page, search],
    queryFn: async () => {
      const res = await hrApi.getDepartments({ pageNumber: page, pageSize: 10, search });
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateDepartmentDto) => hrApi.createDepartment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-departments"] });
      queryClient.invalidateQueries({ queryKey: ["hr-overview"] });
      toast.success("Department created successfully");
      setIsCreateOpen(false);
      setFormData({ departmentCode: "", departmentName: "", description: "" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create department");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentCode.trim() || !formData.departmentName.trim()) {
      toast.warning("Department code and name are required");
      return;
    }
    createMutation.mutate(formData);
  };

  if (isLoading) return <LoadingView title="Loading Departments..." />;
  if (isError) return <ErrorView title="Failed to load Departments" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Department Management"
        description="View and manage organizational departments and manager assignments."
        actions={
          <PermissionButton
            permission="Permissions.HR.Departments.Create"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Add Department
          </PermissionButton>
        }
      />

      <SectionCard className="p-6">
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        {!data?.items?.length ? (
          <EmptyState
            icon={Building2}
            title="No Departments Found"
            description="Create your first department to organize employees."
            action={
              <PermissionButton
                permission="Permissions.HR.Departments.Create"
                onClick={() => setIsCreateOpen(true)}
              >
                Add Department
              </PermissionButton>
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-center">Employees</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((dept: Department) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-mono font-bold text-indigo-600">{dept.departmentCode}</TableCell>
                    <TableCell className="font-medium">{dept.departmentName}</TableCell>
                    <TableCell className="text-slate-500">{dept.description || "—"}</TableCell>
                    <TableCell>{dept.managerUserName || "Unassigned"}</TableCell>
                    <TableCell className="text-center font-semibold">{dept.employeeCount}</TableCell>
                    <TableCell className="text-center">
                      {dept.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Create Department Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Department"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="departmentCode">Department Code *</Label>
            <Input
              id="departmentCode"
              placeholder="e.g. DEP-FIN"
              value={formData.departmentCode}
              onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="departmentName">Department Name *</Label>
            <Input
              id="departmentName"
              placeholder="e.g. Finance & Accounting"
              value={formData.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Department responsibilities..."
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Department"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
