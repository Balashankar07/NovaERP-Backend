import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionOperationsApi } from '@/api/productionOperations.api';
import { productionApi } from '@/api/production.api';
import { hrApi } from '@/api/hr.api';
import { ProductionEvent, CreateProductionEventDto, ProductionEventType } from '@/types/productionOperations.types';
import { AlertTriangle, Plus, RefreshCw, Clock, Wrench, ShieldAlert, Coffee, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const ProductionEventsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch Production Executions, Machines, Employees
  const { data: execResp } = useQuery({
    queryKey: ['execs-for-event'],
    queryFn: () => productionApi.getAllExecutions({ pageNumber: 1, pageSize: 100 }),
  });
  const executions = execResp?.items || [];

  const { data: mchResp } = useQuery({
    queryKey: ['machines-for-event'],
    queryFn: () => productionOperationsApi.getMachines({ pageNumber: 1, pageSize: 100 }),
  });
  const machines = mchResp?.items || [];

  const { data: hrResp } = useQuery({
    queryKey: ['hr-for-event'],
    queryFn: () => hrApi.getEmployees({ pageNumber: 1, pageSize: 100 }),
  });
  const employees = hrResp?.items || [];

  const getLocalIsoString = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const now = new Date();
  const defaultStart = getLocalIsoString(new Date(now.getTime() - 1800000));
  const defaultEnd = getLocalIsoString(now);

  const [formData, setFormData] = useState<CreateProductionEventDto>({
    productionExecutionId: '',
    machineId: '',
    employeeId: '',
    eventType: 'Downtime',
    startTime: defaultStart,
    endTime: defaultEnd,
    reason: 'Tooling recalibration required',
    remarks: 'Log recorded manually by line lead',
  });

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['production-events', page],
    queryFn: () => productionOperationsApi.getEvents({ pageNumber: page, pageSize: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateProductionEventDto) => productionOperationsApi.createEvent(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-events'] });
      setIsDialogOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productionExecutionId || !formData.startTime) {
      toast.warning('Execution and Start Time are required.');
      return;
    }
    if (formData.endTime && new Date(formData.endTime) < new Date(formData.startTime)) {
      toast.error('Event end time cannot be earlier than start time.');
      return;
    }
    
    createMutation.mutate({
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
    });
  };

  const getEventBadge = (type: ProductionEventType) => {
    switch (type) {
      case 'Downtime':
      case 0:
        return <Badge className="bg-red-600"><AlertTriangle className="h-3 w-3 mr-1" /> Downtime</Badge>;
      case 'Setup':
      case 1:
        return <Badge className="bg-blue-600"><Wrench className="h-3 w-3 mr-1" /> Setup</Badge>;
      case 'Maintenance':
      case 2:
        return <Badge className="bg-amber-600"><Wrench className="h-3 w-3 mr-1" /> Maintenance</Badge>;
      case 'Break':
      case 3:
        return <Badge variant="secondary"><Coffee className="h-3 w-3 mr-1" /> Break</Badge>;
      case 'MaterialWaiting':
      case 4:
        return <Badge className="bg-purple-600"><PackageX className="h-3 w-3 mr-1" /> Material Waiting</Badge>;
      case 'QualityHold':
      case 5:
        return <Badge className="bg-orange-600"><ShieldAlert className="h-3 w-3 mr-1" /> Quality Hold</Badge>;
      case 'Other':
      case 6:
      default:
        return <Badge variant="outline">Other Event</Badge>;
    }
  };

  const items = response?.items || [];
  const totalPages = response?.totalPages || 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            Downtime & Production Events
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manual operational event logging for equipment stoppages, setup time, and quality holds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4" /> Log Production Event
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Loading events...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Production Events</h3>
          <p className="text-sm text-slate-500 mt-1">Record downtime, setup shifts, or material waiting delays as they occur.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((ev: ProductionEvent) => (
            <Card key={ev.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-950">
                      Execution: {ev.executionNumber}
                    </Badge>
                    {getEventBadge(ev.eventType)}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Reason: {ev.reason || "Operational delay logged"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {ev.machineName && <span>Machine: <strong className="text-slate-700 dark:text-slate-300">{ev.machineName}</strong></span>}
                    {ev.employeeName && <span>Reported By: <strong className="text-slate-700 dark:text-slate-300">{ev.employeeName}</strong></span>}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <span className="block text-slate-400">Duration / Window:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 justify-end">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(ev.startTime).toLocaleTimeString()} - {ev.endTime ? new Date(ev.endTime).toLocaleTimeString() : 'Ongoing'}
                  </span>
                </div>
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
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Log Downtime or Production Event
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="evExec">Production Execution *</Label>
                <select
                  id="evExec"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={formData.productionExecutionId}
                  onChange={(e) => setFormData({ ...formData, productionExecutionId: e.target.value })}
                  required
                >
                  <option value="">Select Production Execution...</option>
                  {executions.map((e) => (
                    <option key={e.id} value={e.id}>{e.executionNumber} - {e.productName}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="evType">Event Type *</Label>
                <select
                  id="evType"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value as ProductionEventType })}
                  required
                >
                  <option value="Downtime">Downtime</option>
                  <option value="Setup">Setup</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Break">Break</option>
                  <option value="MaterialWaiting">Material Waiting</option>
                  <option value="QualityHold">Quality Hold</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="evMch">Machine (Optional)</Label>
                  <select
                    id="evMch"
                    className="w-full h-10 px-3 rounded-md border bg-background text-xs"
                    value={formData.machineId || ''}
                    onChange={(e) => setFormData({ ...formData, machineId: e.target.value || undefined })}
                  >
                    <option value="">None / N/A</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>{m.machineCode} - {m.machineName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="evEmp">Operator (Optional)</Label>
                  <select
                    id="evEmp"
                    className="w-full h-10 px-3 rounded-md border bg-background text-xs"
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value || undefined })}
                  >
                    <option value="">None / N/A</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.employeeCode} - {emp.user?.firstName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="evStart">Start Time *</Label>
                  <Input
                    id="evStart"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="evEnd">End Time</Label>
                  <Input
                    id="evEnd"
                    type="datetime-local"
                    min={formData.startTime}
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="evReason">Reason / Primary Cause</Label>
                <Input
                  id="evReason"
                  placeholder="e.g. Mechanical Jam, Material Shortage"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createMutation.isPending ? 'Logging...' : 'Log Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
