import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionOperationsApi } from '@/api/productionOperations.api';
import { productionApi } from '@/api/production.api';
import { ProductionSchedule, CreateProductionScheduleDto, ScheduleStatus } from '@/types/productionOperations.types';
import { Calendar, Plus, RefreshCw, Clock, CheckCircle2, PlayCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const ProductionSchedulesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Production Orders & Work Centers & Machines
  const { data: ordersResp } = useQuery({
    queryKey: ['production-orders-for-schedule'],
    queryFn: () => productionApi.getOrders({ pageNumber: 1, pageSize: 100 }),
  });
  const productionOrders = ordersResp?.data?.data?.items || [];

  const { data: wcResp } = useQuery({
    queryKey: ['work-centers-for-schedule'],
    queryFn: () => productionOperationsApi.getWorkCenters({ pageNumber: 1, pageSize: 100 }),
  });
  const workCenters = wcResp?.data?.data?.items || [];

  const { data: mchResp } = useQuery({
    queryKey: ['machines-for-schedule'],
    queryFn: () => productionOperationsApi.getMachines({ pageNumber: 1, pageSize: 100 }),
  });
  const machines = mchResp?.data?.data?.items || [];

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 3600000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 7200000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState<CreateProductionScheduleDto>({
    productionOrderId: '',
    workCenterId: '',
    machineId: '',
    plannedStart: defaultStart,
    plannedEnd: defaultEnd,
    remarks: 'Manual schedule slot',
  });

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['production-schedules', page],
    queryFn: () => productionOperationsApi.getSchedules({ pageNumber: page, pageSize: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateProductionScheduleDto) => productionOperationsApi.createSchedule(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-schedules'] });
      setIsDialogOpen(false);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Schedule conflict or validation error.';
      setErrorMsg(msg);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ScheduleStatus }) =>
      productionOperationsApi.updateScheduleStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-schedules'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productionOrderId || !formData.workCenterId || !formData.plannedStart || !formData.plannedEnd) return;
    setErrorMsg(null);
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case 'Planned':
      case 0:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Planned</Badge>;
      case 'Scheduled':
      case 1:
        return <Badge className="bg-blue-600"><Calendar className="h-3 w-3 mr-1" /> Scheduled</Badge>;
      case 'InProgress':
      case 2:
        return <Badge className="bg-indigo-600"><PlayCircle className="h-3 w-3 mr-1" /> In Progress</Badge>;
      case 'Completed':
      case 3:
        return <Badge className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'Cancelled':
      case 4:
      default:
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
    }
  };

  const items = response?.data?.data?.items || [];
  const totalPages = response?.data?.data?.totalPages || 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Manual Production Schedule
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deterministic shop-floor scheduling with machine time-window overlap validation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => { setErrorMsg(null); setIsDialogOpen(true); }} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4" /> Schedule Production Order
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Loading schedules...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Production Schedules</h3>
          <p className="text-sm text-slate-500 mt-1">Schedule production orders onto work centers and dedicated machinery.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((s: ProductionSchedule) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-950">
                      Order: {s.orderNumber}
                    </Badge>
                    {getStatusBadge(s.status)}
                  </div>
                  <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                    Work Center: {s.workCenterName}
                  </h4>
                  {s.machineName && (
                    <p className="text-xs text-slate-500">
                      Dedicated Equipment: <span className="font-medium text-slate-700 dark:text-slate-300">{s.machineName}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="block text-slate-400">Planned Start:</span>
                    <span className="font-medium">{new Date(s.plannedStart).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Planned End:</span>
                    <span className="font-medium">{new Date(s.plannedEnd).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(s.status === 'Planned' || s.status === 0 || s.status === 'Scheduled' || s.status === 1) && (
                    <Button
                      size="sm"
                      className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: s.id, status: 'InProgress' })}
                    >
                      <PlayCircle className="h-3.5 w-3.5 mr-1" /> Start Execution
                    </Button>
                  )}
                  {(s.status === 'InProgress' || s.status === 2) && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: s.id, status: 'Completed' })}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                    </Button>
                  )}
                  {s.status !== 'Completed' && s.status !== 3 && s.status !== 'Cancelled' && s.status !== 4 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                      onClick={() => updateStatusMutation.mutate({ id: s.id, status: 'Cancelled' })}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Schedule Production Order
              </DialogTitle>
            </DialogHeader>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2 mt-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="poSelect">Production Order *</Label>
                <select
                  id="poSelect"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={formData.productionOrderId}
                  onChange={(e) => setFormData({ ...formData, productionOrderId: e.target.value })}
                  required
                >
                  <option value="">Select Production Order...</option>
                  {productionOrders.map((po) => (
                    <option key={po.id} value={po.id}>{po.orderNumber} - {po.productName} (Qty: {po.plannedQuantity})</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="wcSel">Target Work Center *</Label>
                <select
                  id="wcSel"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={formData.workCenterId}
                  onChange={(e) => setFormData({ ...formData, workCenterId: e.target.value })}
                  required
                >
                  <option value="">Select Work Center...</option>
                  {workCenters.map((wc) => (
                    <option key={wc.id} value={wc.id}>{wc.code} - {wc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="mchSel">Dedicated Machine (Optional)</Label>
                <select
                  id="mchSel"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={formData.machineId || ''}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value || undefined })}
                >
                  <option value="">No specific machine / Shared</option>
                  {machines
                    .filter((m) => !formData.workCenterId || m.workCenterId === formData.workCenterId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.machineCode} - {m.machineName} ({m.status})</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pStart">Planned Start *</Label>
                  <Input
                    id="pStart"
                    type="datetime-local"
                    value={formData.plannedStart}
                    onChange={(e) => setFormData({ ...formData, plannedStart: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pEnd">Planned End *</Label>
                  <Input
                    id="pEnd"
                    type="datetime-local"
                    value={formData.plannedEnd}
                    onChange={(e) => setFormData({ ...formData, plannedEnd: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createMutation.isPending ? 'Scheduling...' : 'Save Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
