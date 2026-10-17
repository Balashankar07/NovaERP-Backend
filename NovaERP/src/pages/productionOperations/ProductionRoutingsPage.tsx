import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionOperationsApi } from '@/api/productionOperations.api';
import { productsApi } from '@/api/products.api';
import { ProductionRouting, CreateProductionRoutingDto, CreateProductionRoutingOperationDto } from '@/types/productionOperations.types';
import { GitFork, Plus, RefreshCw, Layers, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const ProductionRoutingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch Products & Work Centers for form selection
  const { data: productsResp } = useQuery({
    queryKey: ['products-list-for-routing'],
    queryFn: () => productsApi.getProducts({ pageNumber: 1, pageSize: 100 }),
  });
  const products = productsResp?.data?.data?.items || [];

  const { data: wcResp } = useQuery({
    queryKey: ['work-centers-for-routing'],
    queryFn: () => productionOperationsApi.getWorkCenters({ pageNumber: 1, pageSize: 100 }),
  });
  const workCenters = wcResp?.data?.data?.items || [];

  const [formData, setFormData] = useState<CreateProductionRoutingDto>({
    productId: '',
    routingVersion: 'v1.0',
    description: 'Standard Production Routing',
    operations: [
      { sequenceNumber: 10, operationName: 'PCB Assembly', workCenterId: '', standardDurationMinutes: 15, setupDurationMinutes: 5 },
      { sequenceNumber: 20, operationName: 'Functional Testing', workCenterId: '', standardDurationMinutes: 10, setupDurationMinutes: 2 },
    ],
  });

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['production-routings', page],
    queryFn: () => productionOperationsApi.getRoutings({ pageNumber: page, pageSize: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateProductionRoutingDto) => productionOperationsApi.createRouting(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-routings'] });
      setIsDialogOpen(false);
    },
  });

  const addOperationRow = () => {
    const nextSeq = (formData.operations.length + 1) * 10;
    setFormData({
      ...formData,
      operations: [
        ...formData.operations,
        { sequenceNumber: nextSeq, operationName: `Op ${nextSeq}`, workCenterId: '', standardDurationMinutes: 10, setupDurationMinutes: 2 },
      ],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || formData.operations.length === 0) return;
    createMutation.mutate(formData);
  };

  const items = response?.data?.data?.items || [];
  const totalPages = response?.data?.data?.totalPages || 1;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GitFork className="h-6 w-6 text-indigo-600" />
            Production Routings & Operations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define multi-step manufacturing sequences, standard cycle times, and target work centers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4" /> Create Routing
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500">Loading routings...</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <GitFork className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Routings Defined</h3>
          <p className="text-sm text-slate-500 mt-1">Create production operation sequences for finished goods and assemblies.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((r: ProductionRouting) => (
            <Card key={r.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/60 pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">{r.productName}</CardTitle>
                    <Badge variant="outline" className="font-mono text-xs bg-white dark:bg-slate-950">
                      Version: {r.routingVersion}
                    </Badge>
                    {r.isActive && <Badge className="bg-emerald-600">Active</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{r.description || "No routing description."}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  Total Steps: <span className="font-bold text-slate-900 dark:text-slate-100">{r.operations.length}</span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {r.operations
                    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                    .map((op, idx) => (
                      <React.Fragment key={op.id || idx}>
                        {idx > 0 && <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />}
                        <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border shadow-sm flex flex-col min-w-[180px]">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                              SEQ #{op.sequenceNumber}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {op.standardDurationMinutes}m
                            </span>
                          </div>
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{op.operationName}</span>
                          <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Layers className="h-3 w-3 text-slate-400" /> {op.workCenterName}
                          </span>
                        </div>
                      </React.Fragment>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitFork className="h-5 w-5 text-indigo-600" />
                Define Production Routing
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="pSelect">Target Product *</Label>
                <select
                  id="pSelect"
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  required
                >
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.productCode} - {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ver">Version *</Label>
                  <Input
                    id="ver"
                    placeholder="e.g. v1.0"
                    value={formData.routingVersion}
                    onChange={(e) => setFormData({ ...formData, routingVersion: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rdesc">Description</Label>
                  <Input
                    id="rdesc"
                    placeholder="Routing notes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Operations Sequence</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addOperationRow} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Step
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.operations.map((op, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md border space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Seq #</Label>
                          <Input
                            type="number"
                            value={op.sequenceNumber}
                            onChange={(e) => {
                              const newOps = [...formData.operations];
                              newOps[idx].sequenceNumber = parseInt(e.target.value) || 10;
                              setFormData({ ...formData, operations: newOps });
                            }}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Operation Name *</Label>
                          <Input
                            placeholder="e.g. Soldering"
                            value={op.operationName}
                            onChange={(e) => {
                              const newOps = [...formData.operations];
                              newOps[idx].operationName = e.target.value;
                              setFormData({ ...formData, operations: newOps });
                            }}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Work Center *</Label>
                          <select
                            className="w-full h-9 px-2 rounded-md border bg-background text-xs"
                            value={op.workCenterId}
                            onChange={(e) => {
                              const newOps = [...formData.operations];
                              newOps[idx].workCenterId = e.target.value;
                              setFormData({ ...formData, operations: newOps });
                            }}
                            required
                          >
                            <option value="">Select WC...</option>
                            {workCenters.map((wc) => (
                              <option key={wc.id} value={wc.id}>{wc.code} ({wc.name})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Std Duration (min)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={op.standardDurationMinutes}
                            onChange={(e) => {
                              const newOps = [...formData.operations];
                              newOps[idx].standardDurationMinutes = parseInt(e.target.value) || 1;
                              setFormData({ ...formData, operations: newOps });
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Setup Duration (min)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={op.setupDurationMinutes}
                            onChange={(e) => {
                              const newOps = [...formData.operations];
                              newOps[idx].setupDurationMinutes = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, operations: newOps });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createMutation.isPending ? 'Saving...' : 'Save Routing'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
