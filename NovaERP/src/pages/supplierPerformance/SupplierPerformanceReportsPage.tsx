import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierPerformanceApi } from '@/api/supplierPerformance.api';
import { UpdateSupplierScorecardConfigDto } from '@/types/supplierPerformance.types';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { BarChart3, Settings, ShieldCheck, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export const SupplierPerformanceReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['supplier-performance-overview'],
    queryFn: () => supplierPerformanceApi.getOverview(),
  });

  const { data: config, isLoading: isConfigLoading, refetch: refetchConfig } = useQuery({
    queryKey: ['supplier-scorecard-config'],
    queryFn: () => supplierPerformanceApi.getConfig(),
  });

  const [formData, setFormData] = useState<UpdateSupplierScorecardConfigDto>({
    deliveryWeight: 30,
    fulfillmentWeight: 25,
    qualityWeight: 30,
    commercialWeight: 15,
    gradeAThreshold: 90,
    gradeBThreshold: 75,
    gradeCThreshold: 60,
    notes: 'Updated scorecard weighting configuration',
  });

  const updateConfigMutation = useMutation({
    mutationFn: (dto: UpdateSupplierScorecardConfigDto) => supplierPerformanceApi.updateConfig(dto),
    onSuccess: () => {
      toast.success('Supplier Scorecard Weights updated successfully');
      queryClient.invalidateQueries({ queryKey: ['supplier-scorecard-config'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-performance-overview'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-performance-summaries'] });
      setConfigDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update scorecard config');
    },
  });

  const handleOpenConfigModal = () => {
    if (config) {
      setFormData({
        deliveryWeight: config.deliveryWeight,
        fulfillmentWeight: config.fulfillmentWeight,
        qualityWeight: config.qualityWeight,
        commercialWeight: config.commercialWeight,
        gradeAThreshold: config.gradeAThreshold,
        gradeBThreshold: config.gradeBThreshold,
        gradeCThreshold: config.gradeCThreshold,
        notes: config.notes || '',
      });
    }
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const sum = Number(formData.deliveryWeight) + Number(formData.fulfillmentWeight) + Number(formData.qualityWeight) + Number(formData.commercialWeight);
    if (Math.abs(sum - 100) > 0.01) {
      toast.error(`Weights must sum to exactly 100%. Current sum: ${sum}%`);
      return;
    }
    updateConfigMutation.mutate(formData);
  };

  if (isOverviewLoading || isConfigLoading) return <LoadingView title="Loading Supplier Performance Reports & Config..." />;

  const currentSum = Number(formData.deliveryWeight) + Number(formData.fulfillmentWeight) + Number(formData.qualityWeight) + Number(formData.commercialWeight);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Supplier Performance Analytics & Weight Configuration"
        description="View global supplier compliance metrics and configure deterministic scorecard weighting parameters (Domain 7)."
        actions={
          <Button onClick={handleOpenConfigModal} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Settings className="h-4 w-4" /> Configure Score Weights
          </Button>
        }
      />

      {/* Current Configuration Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600" /> Active Scorecard Weighting Formula
          </CardTitle>
          <CardDescription>
            The deterministic formula applied across all vendor evaluations in NovaERP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <div className="text-xs text-muted-foreground font-medium uppercase">Delivery Weight</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">{config?.deliveryWeight}%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">On-Time Delivery Rate</div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <div className="text-xs text-muted-foreground font-medium uppercase">Fulfillment Weight</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{config?.fulfillmentWeight}%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Order Fill Rate</div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <div className="text-xs text-muted-foreground font-medium uppercase">Quality Weight</div>
              <div className="text-2xl font-bold text-purple-700 mt-1">{config?.qualityWeight}%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Acceptance Rate</div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <div className="text-xs text-muted-foreground font-medium uppercase">Commercial Weight</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{config?.commercialWeight}%</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Catalog Price Variance</div>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="h-4 w-4 text-blue-500" />
            <span>Last Updated: {config?.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'System Default'} | Thresholds: Grade A (≥{config?.gradeAThreshold}%), Grade B (≥{config?.gradeBThreshold}%), Grade C (≥{config?.gradeCThreshold}%)</span>
          </div>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Supplier Scorecard Weights</DialogTitle>
            <DialogDescription>
              Adjust metric weights and grade thresholds. Weights must sum to 100%.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveConfig} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryWeight">Delivery Weight (%)</Label>
                <Input
                  id="deliveryWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.deliveryWeight}
                  onChange={(e) => setFormData({ ...formData, deliveryWeight: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fulfillmentWeight">Fulfillment Weight (%)</Label>
                <Input
                  id="fulfillmentWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.fulfillmentWeight}
                  onChange={(e) => setFormData({ ...formData, fulfillmentWeight: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qualityWeight">Quality Weight (%)</Label>
                <Input
                  id="qualityWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.qualityWeight}
                  onChange={(e) => setFormData({ ...formData, qualityWeight: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="commercialWeight">Commercial Weight (%)</Label>
                <Input
                  id="commercialWeight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.commercialWeight}
                  onChange={(e) => setFormData({ ...formData, commercialWeight: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className={`text-xs font-semibold p-2 rounded ${Math.abs(currentSum - 100) < 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              Total Weight Sum: {currentSum}% {Math.abs(currentSum - 100) < 0.01 ? '✓ (Valid)' : '✗ (Must equal 100%)'}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Audit Notes</Label>
              <Input
                id="notes"
                placeholder="Reason for weight adjustment..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateConfigMutation.isPending || Math.abs(currentSum - 100) > 0.01}>
                Save Weights
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
