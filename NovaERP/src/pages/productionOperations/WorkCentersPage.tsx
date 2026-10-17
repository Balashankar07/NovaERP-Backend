import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionOperationsApi } from '@/api/productionOperations.api';
import { WorkCenter, CreateWorkCenterDto } from '@/types/productionOperations.types';
import { Factory, Plus, RefreshCw, Search, CheckCircle2, XCircle, Building2, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const WorkCentersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateWorkCenterDto>({
    code: '',
    name: '',
    description: '',
    capacity: 100,
    isActive: true,
  });

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['production-work-centers', page, searchTerm],
    queryFn: () => productionOperationsApi.getWorkCenters({ pageNumber: page, pageSize: 10, search: searchTerm }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateWorkCenterDto) => productionOperationsApi.createWorkCenter(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-work-centers'] });
      setIsDialogOpen(false);
      setFormData({ code: '', name: '', description: '', capacity: 100, isActive: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;
    createMutation.mutate(formData);
  };

  const items = response?.data?.data?.items || [];
  const totalPages = response?.data?.data?.totalPages || 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Factory className="h-6 w-6 text-indigo-600" />
            Production Work Centers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Logical manufacturing areas, capacity bounds, and line designations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4" /> Add Work Center
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-9 bg-white dark:bg-slate-950"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Loading work centers...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Factory className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Work Centers Found</h3>
          <p className="text-sm text-slate-500 mt-1">Create your first production work center to organize shop-floor activities.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((wc: WorkCenter) => (
            <Card key={wc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <Badge variant="outline" className="font-mono text-xs text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40">
                    {wc.code}
                  </Badge>
                  <CardTitle className="text-base font-semibold mt-1">{wc.name}</CardTitle>
                </div>
                <Badge variant={wc.isActive ? "default" : "secondary"} className={wc.isActive ? "bg-emerald-600" : ""}>
                  {wc.isActive ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                  {wc.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-3 text-sm space-y-2">
                <p className="text-xs text-slate-500 line-clamp-2">{wc.description || "No description provided."}</p>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t pt-2 mt-2">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {wc.departmentName || "All Depts"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                    {wc.warehouseName || "Default Warehouse"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 border-t pt-2">
                  <span>Standard Capacity:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{wc.capacity} units/hr</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-indigo-600" />
                Add Work Center
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="code">Work Center Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g. WC-ASSY-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Work Center Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. PCB Assembly Line A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Line details or operational notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="capacity">Standard Hourly Capacity</Label>
                <Input
                  id="capacity"
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
                {createMutation.isPending ? 'Creating...' : 'Create Work Center'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
