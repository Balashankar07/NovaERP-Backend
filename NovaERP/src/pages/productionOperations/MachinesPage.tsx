import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionOperationsApi } from '@/api/productionOperations.api';
import { Machine, CreateMachineDto, MachineStatus } from '@/types/productionOperations.types';
import { Cpu, Plus, RefreshCw, Search, Wrench, AlertCircle, PlayCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const MachinesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch Work Centers for selection dropdown
  const { data: wcResponse } = useQuery({
    queryKey: ['production-work-centers-list'],
    queryFn: () => productionOperationsApi.getWorkCenters({ pageNumber: 1, pageSize: 100 }),
  });
  const workCenters = wcResponse?.data?.data?.items || [];

  const [formData, setFormData] = useState<CreateMachineDto>({
    machineCode: '',
    machineName: '',
    workCenterId: '',
    machineType: 'CNC Assembly Machine',
    capacity: 50,
    status: 'Available',
    isActive: true,
  });

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['production-machines', page, searchTerm],
    queryFn: () => productionOperationsApi.getMachines({ pageNumber: page, pageSize: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateMachineDto) => productionOperationsApi.createMachine(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-machines'] });
      setIsDialogOpen(false);
      setFormData({ machineCode: '', machineName: '', workCenterId: '', machineType: 'CNC Assembly Machine', capacity: 50, status: 'Available', isActive: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.machineCode || !formData.machineName || !formData.workCenterId) return;
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status: MachineStatus) => {
    switch (status) {
      case 'Available':
      case 0:
        return <Badge className="bg-emerald-600"><PlayCircle className="h-3 w-3 mr-1" /> Available</Badge>;
      case 'Scheduled':
      case 1:
        return <Badge className="bg-blue-600"><Clock className="h-3 w-3 mr-1" /> Scheduled</Badge>;
      case 'Running':
      case 2:
        return <Badge className="bg-indigo-600"><PlayCircle className="h-3 w-3 mr-1" /> Running</Badge>;
      case 'Maintenance':
      case 3:
        return <Badge className="bg-amber-600"><Wrench className="h-3 w-3 mr-1" /> Maintenance</Badge>;
      case 'Offline':
      case 4:
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Offline</Badge>;
    }
  };

  const items = response?.data?.data?.items || [];
  const totalPages = response?.data?.data?.totalPages || 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-600" />
            Machine & Equipment Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track operational status, capacity, and work center bindings for shop-floor machinery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4" /> Register Machine
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search machines..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-9 bg-white dark:bg-slate-950"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Loading machines...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Cpu className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Machines Registered</h3>
          <p className="text-sm text-slate-500 mt-1">Add physical equipment to assign work orders and schedule operations.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m: Machine) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <Badge variant="outline" className="font-mono text-xs text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40">
                    {m.machineCode}
                  </Badge>
                  <CardTitle className="text-base font-semibold mt-1">{m.machineName}</CardTitle>
                </div>
                {getStatusBadge(m.status)}
              </CardHeader>
              <CardContent className="pt-3 text-sm space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Type:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{m.machineType || "Standard"}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Work Center:</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">{m.workCenterName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 border-t pt-2 mt-2">
                  <span>Capacity:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{m.capacity} units/hr</span>
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
                <Cpu className="h-5 w-5 text-indigo-600" />
                Register Machine / Equipment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="mcode">Machine Code *</Label>
                <Input
                  id="mcode"
                  placeholder="e.g. MCH-SMT-01"
                  value={formData.machineCode}
                  onChange={(e) => setFormData({ ...formData, machineCode: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mname">Machine Name *</Label>
                <Input
                  id="mname"
                  placeholder="e.g. Surface Mount Pick & Place 01"
                  value={formData.machineName}
                  onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="wcSelect">Work Center *</Label>
                <select
                  id="wcSelect"
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
                <Label htmlFor="mtype">Machine Type</Label>
                <Input
                  id="mtype"
                  placeholder="e.g. Pick & Place Machine"
                  value={formData.machineType}
                  onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cap">Hourly Capacity</Label>
                <Input
                  id="cap"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createMutation.isPending ? 'Registering...' : 'Register Machine'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
