import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Play, CheckCircle2, ShieldCheck, AlertTriangle, Plus, Trash2 } from 'lucide-react';

import { qualityApi } from '@/api/quality.api';
import { QualityInspectionStatus } from '@/types/quality.types';
import { ROUTES } from '@/routes';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from '@/utils/toast';

import { PageContainer, PageHeader, SectionCard } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { StatusBadge } from '@/components/ui/status-badge';
import { PermissionButton } from '@/components/common/permission-button';

export function QualityInspectionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  
  const canView = hasPermission('Permissions.QualityInspection.View');
  const canUpdate = hasPermission('Permissions.QualityInspection.Update');
  
  const [passed, setPassed] = useState<number>(0);
  const [failed, setFailed] = useState<number>(0);
  const [defectCode, setDefectCode] = useState('');
  const [defectName, setDefectName] = useState('');
  const [defectQty, setDefectQty] = useState<number>(0);
  const [defectSeverity, setDefectSeverity] = useState('Minor');
  const [defectRemarks, setDefectRemarks] = useState('');

  const { data: inspection, isLoading, isError, refetch } = useQuery({
    queryKey: ['qualityInspection', id],
    queryFn: () => qualityApi.getById(id!),
    enabled: !!id && canView
  });

  useEffect(() => {
    if (inspection) {
      setPassed(inspection.passedQuantity || 0);
      setFailed(inspection.failedQuantity || 0);
    }
  }, [inspection]);

  const startMutation = useMutation({
    mutationFn: () => qualityApi.start(id!),
    onSuccess: () => {
      toast.success("Inspection started successfully.");
      queryClient.invalidateQueries({ queryKey: ['qualityInspection', id] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to start inspection.")
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await qualityApi.update(id!, { passedQuantity: passed, failedQuantity: failed });
      return qualityApi.complete(id!);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['qualityInspection', id] });
      queryClient.invalidateQueries({ queryKey: ['quality-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (res.status === 'Passed') toast.success(`${res.passedQuantity} units released to Finished Goods inventory.`);
      else if (res.status === 'PartiallyPassed') toast.success(`${res.passedQuantity} units approved and released.`);
      else if (res.status === 'Failed') toast.success(`Inspection failed. No finished goods released.`);
    },
    onError: (err: any) => toast.error(err.message || "Failed to complete inspection.")
  });

  const addDefectMutation = useMutation({
    mutationFn: () => qualityApi.addDefect(id!, {
      defectCode,
      defectName,
      quantity: defectQty,
      severity: defectSeverity,
      remarks: defectRemarks
    }),
    onSuccess: () => {
      toast.success("Defect logged successfully.");
      setDefectCode('');
      setDefectName('');
      setDefectQty(0);
      setDefectRemarks('');
      queryClient.invalidateQueries({ queryKey: ['qualityInspection', id] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to log defect.")
  });

  const removeDefectMutation = useMutation({
    mutationFn: (defectId: string) => qualityApi.removeDefect(id!, defectId),
    onSuccess: () => {
      toast.success("Defect removed.");
      queryClient.invalidateQueries({ queryKey: ['qualityInspection', id] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to remove defect.")
  });

  if (!canView) {
    return <ErrorView title="Access Denied" description="You don't have permission to view quality inspections." />;
  }

  if (isLoading) return <PageContainer><LoadingView title="Loading Inspection Details..." /></PageContainer>;
  if (isError || !inspection) return <PageContainer><ErrorView title="Failed to load inspection" onRetry={() => refetch()} /></PageContainer>;

  const totalQuantity = passed + failed;
  const isQuantityValid = totalQuantity === inspection.inspectedQuantity && passed >= 0 && failed >= 0;

  const statusStr = String(inspection.status).toLowerCase();
  const isDraft = statusStr === '0' || statusStr === 'draft';
  const isInProgress = statusStr === '1' || statusStr === 'inprogress';
  const isPassed = statusStr === '2' || statusStr === 'passed';
  const isPartiallyPassed = statusStr === '3' || statusStr === 'partiallypassed';
  const isFailed = statusStr === '4' || statusStr === 'failed';
  const isCancelled = statusStr === '5' || statusStr === 'cancelled';
  const isCompleted = isPassed || isPartiallyPassed || isFailed;

  return (
    <PageContainer>
      <PageHeader
        title={`Inspection ${inspection.inspectionNumber}`}
        description="View and manage quality inspection details."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.QUALITY)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Traceability Details" icon={<ShieldCheck className="w-5 h-5 text-indigo-500" />}>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Inspection Number</p>
                <p className="font-medium">{inspection.inspectionNumber}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Status</p>
                <StatusBadge 
                  status={inspection.status}
                  customStyles={{
                    Draft: "bg-slate-100 text-slate-700",
                    InProgress: "bg-blue-100 text-blue-700",
                    Passed: "bg-green-100 text-green-700",
                    PartiallyPassed: "bg-amber-100 text-amber-700",
                    Failed: "bg-rose-100 text-rose-700",
                    Cancelled: "bg-slate-100 text-slate-500"
                  }}
                />
              </div>
              <div>
                <p className="text-slate-500 mb-1">Product</p>
                <p className="font-medium text-indigo-600">{inspection.productId}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Production Execution</p>
                <p className="font-medium text-indigo-600">{inspection.productionExecutionId}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Output Warehouse</p>
                <p className="font-medium">{inspection.outputWarehouseId || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Output Location</p>
                <p className="font-medium">{inspection.outputWarehouseLocationId || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Inspection Date</p>
                <p className="font-medium">{inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Inspector</p>
                <p className="font-medium">{inspection.inspectorId || '—'}</p>
              </div>
            </div>
          </SectionCard>

          {isDraft && (
            <SectionCard title="Actions">
              <p className="text-sm text-slate-600 mb-4">This inspection is currently in Draft state. Start the inspection to begin recording quantities.</p>
              <PermissionButton 
                permission="Permissions.QualityInspection.Start"
                onClick={() => startMutation.mutate()}
                isLoading={startMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" /> Start Inspection
              </PermissionButton>
            </SectionCard>
          )}

          {isInProgress && (
            <SectionCard title="Complete Inspection" icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Inspected Quantity</label>
                  <input type="number" className="w-full border p-2 rounded bg-slate-50 text-slate-500" value={inspection.inspectedQuantity} disabled />
                </div>
                <div></div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passed Quantity</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="w-full border p-2 rounded" 
                    value={passed} 
                    onChange={e => setPassed(Number(e.target.value))} 
                    disabled={!canUpdate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Failed Quantity</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="w-full border p-2 rounded" 
                    value={failed} 
                    onChange={e => setFailed(Number(e.target.value))}
                    disabled={!canUpdate}
                  />
                </div>
              </div>
              
              {!isQuantityValid && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded text-sm mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  Passed ({passed}) + Failed ({failed}) must equal Inspected Quantity ({inspection.inspectedQuantity}).
                </div>
              )}
              
              <PermissionButton 
                permission="Permissions.QualityInspection.Complete"
                onClick={() => completeMutation.mutate()}
                disabled={!isQuantityValid || completeMutation.isPending}
                isLoading={completeMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Complete
              </PermissionButton>
            </SectionCard>
          )}
          
          {isCompleted && (
            <SectionCard title="Final Results">
               <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Inspected Quantity</p>
                    <p className="font-medium text-lg">{inspection.inspectedQuantity}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Passed</p>
                    <p className="font-medium text-lg text-green-600">{inspection.passedQuantity}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Failed</p>
                    <p className="font-medium text-lg text-rose-600">{inspection.failedQuantity}</p>
                  </div>
               </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="Quality Defects">
            {inspection.qualityDefects && inspection.qualityDefects.length > 0 ? (
              <div className="space-y-3 mb-4">
                {inspection.qualityDefects.map(defect => (
                  <div key={defect.id} className="p-3 border rounded-lg bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{defect.defectCode}</span>
                          <StatusBadge 
                            status={defect.severity} 
                            customStyles={{
                              Critical: "bg-rose-100 text-rose-700",
                              Major: "bg-orange-100 text-orange-700",
                              Minor: "bg-amber-100 text-amber-700"
                            }}
                          />
                        </div>
                        <p className="text-sm text-slate-700">{defect.defectName} (Qty: {defect.quantity})</p>
                        {defect.remarks && <p className="text-xs text-slate-500 mt-1">{defect.remarks}</p>}
                      </div>
                      {canUpdate && inspection.status === 'InProgress' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-rose-600"
                          onClick={() => removeDefectMutation.mutate(defect.id)}
                          disabled={removeDefectMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-4">No defects recorded.</p>
            )}

            {canUpdate && inspection.status === 'InProgress' && failed > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Log New Defect</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Code (e.g., SCR-01)" className="border p-2 rounded text-sm w-full" value={defectCode} onChange={e => setDefectCode(e.target.value)} />
                    <input type="number" placeholder="Quantity" min="1" className="border p-2 rounded text-sm w-full" value={defectQty || ''} onChange={e => setDefectQty(Number(e.target.value))} />
                  </div>
                  <input type="text" placeholder="Defect Name" className="border p-2 rounded text-sm w-full" value={defectName} onChange={e => setDefectName(e.target.value)} />
                  <select className="border p-2 rounded text-sm w-full" value={defectSeverity} onChange={e => setDefectSeverity(e.target.value)}>
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <textarea placeholder="Remarks" className="border p-2 rounded text-sm w-full" rows={2} value={defectRemarks} onChange={e => setDefectRemarks(e.target.value)} />
                  <Button 
                    size="sm" 
                    className="w-full"
                    disabled={!defectCode || !defectName || defectQty <= 0 || addDefectMutation.isPending}
                    onClick={() => addDefectMutation.mutate()}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Log Defect
                  </Button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}