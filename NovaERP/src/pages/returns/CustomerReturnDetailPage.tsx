import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '@/api/returns.api';
import { CustomerReturnStatus } from '@/types/returns.types';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  Send, 
  CheckCircle2, 
  XCircle, 
  PackageCheck, 
  Wrench, 
  Truck, 
  ArrowLeft,
  FileCheck2,
  Lock
} from 'lucide-react';

export const CustomerReturnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: returnData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer-return', id],
    queryFn: () => returnsApi.getReturnById(id!),
    enabled: !!id
  });

  const submitMutation = useMutation({
    mutationFn: () => returnsApi.submitReturn(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-return', id] })
  });

  const approveMutation = useMutation({
    mutationFn: () => returnsApi.approveReturn(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-return', id] });
      queryClient.invalidateQueries({ queryKey: ['rmas'] });
    }
  });

  const closeMutation = useMutation({
    mutationFn: () => returnsApi.closeReturn(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-return', id] })
  });

  if (isLoading) return <LoadingView title="Loading Return Details..." />;
  if (isError || !returnData) return <ErrorView title="Failed to load return details" onRetry={refetch} />;

  const isClosedOrCancelled = returnData.status === CustomerReturnStatus.Closed || returnData.status === CustomerReturnStatus.Cancelled;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/returns/requests')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Returns List
        </Button>
      </div>

      <PageHeader
        title={`Customer Return: ${returnData.returnNumber}`}
        description={`Customer: ${returnData.customerName} | Sales Order: ${returnData.salesOrderNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline">{returnData.statusName}</Badge>

            {returnData.status === CustomerReturnStatus.Draft && (
              <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="gap-1">
                <Send className="h-4 w-4" /> Submit Return
              </Button>
            )}

            {returnData.status === CustomerReturnStatus.Submitted && (
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Approve & Issue RMA
              </Button>
            )}

            {!isClosedOrCancelled && returnData.status >= CustomerReturnStatus.Approved && (
              <Button variant="outline" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending} className="gap-1">
                <Lock className="h-4 w-4" /> Close Return
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold">Customer & Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Customer:</span> <strong className="font-semibold">{returnData.customerName}</strong></div>
            <div><span className="text-muted-foreground">Sales Order:</span> <span className="font-mono">{returnData.salesOrderNumber}</span></div>
            <div><span className="text-muted-foreground">Shipment Tracking:</span> {returnData.shipmentTrackingNumber || 'N/A'}</div>
            <div><span className="text-muted-foreground">Requested Date:</span> {new Date(returnData.requestedDate).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold">RMA Authorization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {returnData.rma ? (
              <>
                <div><span className="text-muted-foreground">RMA #:</span> <strong className="font-mono text-emerald-600">{returnData.rma.rmaNumber}</strong></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={returnData.rma.statusName} /></div>
                <div><span className="text-muted-foreground">Authorized Date:</span> {new Date(returnData.rma.authorizationDate).toLocaleDateString()}</div>
                <div><span className="text-muted-foreground">Authorized By:</span> {returnData.rma.authorizedByName || 'System'}</div>
              </>
            ) : (
              <p className="text-muted-foreground text-xs italic">No RMA generated yet. RMA is issued upon approval.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold">Return Reason & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Reason:</span> <p className="font-medium text-slate-800">{returnData.reason}</p></div>
            {returnData.notes && <div><span className="text-muted-foreground">Notes:</span> <p className="text-xs text-slate-600">{returnData.notes}</p></div>}
          </CardContent>
        </Card>
      </div>

      {/* Returned Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-600" /> Returned Line Items ({returnData.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-3">Product Code</th>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Serial / Batch #</th>
                  <th className="px-6 py-3">Condition</th>
                  <th className="px-6 py-3">Item Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {returnData.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{item.productCode}</td>
                    <td className="px-6 py-4 font-medium">{item.productName}</td>
                    <td className="px-6 py-4 font-bold">{item.quantity}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {item.serialNumber && <div><span className="text-muted-foreground">SN:</span> {item.serialNumber}</div>}
                      {item.batchNumber && <div><span className="text-muted-foreground">Batch:</span> {item.batchNumber}</div>}
                      {!item.serialNumber && !item.batchNumber && <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-normal">{item.conditionName}</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Related Stage Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Warehouse Receipts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-purple-600" /> Warehouse Receipts ({returnData.receipts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {returnData.receipts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No warehouse receipts logged yet for this return.</p>
            ) : (
              <div className="space-y-3">
                {returnData.receipts.map(rec => (
                  <div key={rec.id} className="p-3 border rounded-md text-xs space-y-1 bg-slate-50">
                    <div className="flex justify-between font-semibold">
                      <span className="font-mono text-purple-700">{rec.receiptNumber}</span>
                      <span>{new Date(rec.receivedDate).toLocaleDateString()}</span>
                    </div>
                    <div>Product: {rec.productName} ({rec.quantity} unit)</div>
                    <div>Warehouse: {rec.warehouseName}</div>
                    {rec.inspectionStatus && <div>Quality Inspection: <Badge variant="secondary">{rec.inspectionStatus}</Badge></div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quality Dispositions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Quality Dispositions ({returnData.dispositions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {returnData.dispositions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No quality dispositions executed yet.</p>
            ) : (
              <div className="space-y-3">
                {returnData.dispositions.map(disp => (
                  <div key={disp.id} className="p-3 border rounded-md text-xs space-y-1 bg-slate-50">
                    <div className="flex justify-between font-semibold">
                      <span className="font-mono text-emerald-700">{disp.dispositionNumber}</span>
                      <StatusBadge status={disp.statusName} />
                    </div>
                    <div>Type: <strong className="font-semibold text-slate-800">{disp.dispositionTypeName}</strong></div>
                    <div>Product: {disp.productName} ({disp.quantity} unit)</div>
                    <div>Reason: {disp.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bench Repairs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2"><Wrench className="h-5 w-5 text-amber-600" /> Bench Repairs ({returnData.repairs.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {returnData.repairs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No bench repairs logged.</p>
            ) : (
              <div className="space-y-3">
                {returnData.repairs.map(rep => (
                  <div key={rep.id} className="p-3 border rounded-md text-xs space-y-1 bg-slate-50">
                    <div className="flex justify-between font-semibold">
                      <span className="font-mono text-amber-700">{rep.repairNumber}</span>
                      <StatusBadge status={rep.statusName} />
                    </div>
                    <div>Product: {rep.productName} {rep.serialNumber && `(SN: ${rep.serialNumber})`}</div>
                    <div>Fault: {rep.faultDescription}</div>
                    {rep.reinspectionStatus && <div>Reinspection: <Badge variant="outline">{rep.reinspectionStatus}</Badge></div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Replacements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2"><Truck className="h-5 w-5 text-indigo-600" /> Replacement Orders ({returnData.replacements.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {returnData.replacements.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No replacement orders issued.</p>
            ) : (
              <div className="space-y-3">
                {returnData.replacements.map(rpl => (
                  <div key={rpl.id} className="p-3 border rounded-md text-xs space-y-1 bg-slate-50">
                    <div className="flex justify-between font-semibold">
                      <span className="font-mono text-indigo-700">{rpl.replacementNumber}</span>
                      <StatusBadge status={rpl.statusName} />
                    </div>
                    <div>Product: {rpl.productName} ({rpl.quantity} unit)</div>
                    <div>Warehouse: {rpl.warehouseName}</div>
                    {rpl.shipmentTrackingNumber && <div>Tracking: <span className="font-mono text-slate-800">{rpl.shipmentTrackingNumber}</span></div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
