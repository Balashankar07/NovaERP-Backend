import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionOperationsApi } from '@/api/productionOperations.api';
import { hrApi } from '@/api/hr.api';
import { productionApi } from '@/api/production.api';
import { ProductionWorkerAssignment, CreateWorkerAssignmentDto } from '@/types/productionOperations.types';
import { Users, UserPlus, RefreshCw, CheckCircle2, Clock, UserCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const WorkerAssignmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch HR employees for assignment
  const { data: hrResp } = useQuery({
    queryKey: ['hr-employees-for-assignment'],
    queryFn: () => hrApi.getEmployees({ pageNumber: 1, pageSize: 100 }),
  });
  const employees = hrResp?.data?.data?.items || [];

  // Fetch Production Executions for target selection
  const { data: execResp } = useQuery({
    queryKey: ['production-executions-for-assignment'],
    queryFn: () => productionApi.getExecutions({ pageNumber: 1, pageSize: 100 }),
  });
  const executions = execResp?.data?.data?.items || [];

  const [formData, setFormData] = useState<CreateWorkerAssignmentDto>({
    productionExecutionId: '',
    employeeId: '',
    roleOrFunction: 'Operator',
    remarks: 'Assigned for active shift',
  });

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['production-worker-assignments', page],
    queryFn: () => productionOperationsApi.getWorkerAssignments({ pageNumber: page, pageSize: 10 }),
  });

  const assignMutation = useMutation({
    mutationFn: (dto: CreateWorkerAssignmentDto) => productionOperationsApi.assignWorker(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-worker-assignments'] });
      setIsDialogOpen(false);
      setFormData({ productionExecutionId: '', employeeId: '', roleOrFunction: 'Operator', remarks: '' });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => productionOperationsApi.completeWorkerAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-worker-assignments'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productionExecutionId || !formData.employeeId) return;
    assignMutation.mutate(formData);
  };

  const items = response?.data?.data?.items || [];
  const totalPages = response?.data?.data?.totalPages || 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Shop-Floor Worker Assignments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Assign verified HR Employee Profiles to active production execution runs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <UserPlus className="h-4 w-4" /> Assign Employee
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Loading worker assignments...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Worker Assignments</h3>
          <p className="text-sm text-slate-500 mt-1">Assign active HR employees to current production executions.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((a: ProductionWorkerAssignment) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <Badge variant="outline" className="font-mono text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-950">
                    Execution: {a.executionNumber}
                  </Badge>
                  <CardTitle className="text-base font-semibold mt-1 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    {a.employeeName}
                  </CardTitle>
                </div>
                <Badge variant={a.status === 'Active' ? 'default' : 'secondary'} className={a.status === 'Active' ? 'bg-emerald-600' : ''}>
                  {a.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-3 text-sm space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Employee Code:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{a.employeeNumber}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Role / Function:</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">{a.roleOrFunction}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 border-t pt-2 mt-2">
                  <span>Start Time:</span>
                  <span>{new Date(a.startTime).toLocaleString()}</span>
                </div>
                {a.status === 'Active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    disabled={completeMutation.isPending}
                    onClick={() => completeMutation.mutate(a.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Shift Complete
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                Assign Worker to Production Execution
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="execSelect">Production Execution *</Label>
                <select
                  id="execSelect"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={formData.productionExecutionId}
                  onChange={(e) => setFormData({ ...formData, productionExecutionId: e.target.value })}
                  required
                >
                  <option value="">Select Production Execution...</option>
                  {executions.map((e) => (
                    <option key={e.id} value={e.id}>{e.executionNumber} (Status: {e.status})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="empSelect">HR Employee Profile *</Label>
                <select
                  id="empSelect"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.employeeCode} - {emp.user?.firstName} {emp.user?.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="role">Operational Role / Function</Label>
                <Input
                  id="role"
                  placeholder="e.g. Line Inspector, Lead Operator"
                  value={formData.roleOrFunction}
                  onChange={(e) => setFormData({ ...formData, roleOrFunction: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="remarks">Shift Remarks</Label>
                <Input
                  id="remarks"
                  placeholder="Operational notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {assignMutation.isPending ? 'Assigning...' : 'Assign Worker'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
