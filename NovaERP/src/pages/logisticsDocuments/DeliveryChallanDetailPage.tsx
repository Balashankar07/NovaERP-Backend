import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logisticsDocumentsApi } from '@/api/logisticsDocuments.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Printer, 
  Building2, 
  MapPin, 
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const DeliveryChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: challan, isLoading, isError, refetch } = useQuery({
    queryKey: ['delivery-challan-detail', id],
    queryFn: () => logisticsDocumentsApi.getDeliveryChallanById(id!),
    enabled: !!id,
  });

  const issueMutation = useMutation({
    mutationFn: (dcId: string) => logisticsDocumentsApi.issueDeliveryChallan(dcId),
    onSuccess: () => {
      toast.success('Delivery Challan Officially Issued');
      queryClient.invalidateQueries({ queryKey: ['delivery-challan-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['delivery-challans'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-documents-overview'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to issue Delivery Challan');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (dcId: string) => logisticsDocumentsApi.cancelDeliveryChallan(dcId),
    onSuccess: () => {
      toast.success('Delivery Challan Cancelled');
      queryClient.invalidateQueries({ queryKey: ['delivery-challan-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['delivery-challans'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-documents-overview'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel Delivery Challan');
    },
  });

  if (isLoading) return <LoadingView title="Loading Delivery Challan details..." />;
  if (isError || !challan) return <ErrorView title="Failed to load Delivery Challan" onRetry={refetch} />;

  const getStatusBadge = (status: string) => {
    if (status === 'Issued') return <Badge className="bg-emerald-600 text-white px-3 py-1 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Issued</Badge>;
    if (status === 'Cancelled') return <Badge variant="destructive" className="px-3 py-1 text-sm font-semibold"><XCircle className="h-4 w-4 mr-1.5" /> Cancelled</Badge>;
    return <Badge variant="outline" className="text-amber-700 border-amber-300 px-3 py-1 text-sm font-semibold"><Clock className="h-4 w-4 mr-1.5" /> Draft</Badge>;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate('/logistics/delivery-challans')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Delivery Challans
        </Button>
      </div>

      <PageHeader
        title={`Delivery Challan: ${challan.challanNumber}`}
        description={`Statutory dispatch note for carrier transport to ${challan.customerName}`}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" /> Print Challan
            </Button>
            {challan.status === 'Draft' && (
              <>
                <Button 
                  onClick={() => issueMutation.mutate(challan.id)} 
                  disabled={issueMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Officially Issue Challan
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => cancelMutation.mutate(challan.id)} 
                  disabled={cancelMutation.isPending}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" /> Cancel Challan
                </Button>
              </>
            )}
            {getStatusBadge(challan.status)}
          </div>
        }
      />

      {/* Structured Challan View */}
      <Card className="print:border-none print:shadow-none">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="h-6 w-6 text-blue-600" /> DELIVERY CHALLAN / DISPATCH NOTE
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">NovaERP Commercial & Logistics Documentation</div>
            </div>
            <div className="text-right font-mono text-sm">
              <div className="font-bold text-blue-700">{challan.challanNumber}</div>
              <div className="text-xs text-muted-foreground">Issue Date: {new Date(challan.issueDate).toLocaleDateString()}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Header Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border">
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Consignee / Recipient</div>
              <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">{challan.customerName}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Shipment Tracking #</div>
              <div className="font-mono font-bold text-blue-700 mt-1">{challan.trackingNumber}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Sales Order #</div>
              <div className="font-mono font-bold text-indigo-700 mt-1">{challan.orderNumber}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Carrier / Transporter</div>
              <div className="font-bold mt-1">{challan.carrier}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Vehicle Number</div>
              <div className="font-mono font-bold mt-1">{challan.vehicleNumber || 'N/A'}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-rose-500" /> Destination Address
              </div>
              <div className="font-medium text-xs mt-1 text-slate-800 dark:text-slate-200">{challan.destinationAddress}</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dispatched Product Goods</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Product Code / Name</th>
                    <th className="px-4 py-3">Batch Number</th>
                    <th className="px-4 py-3">Serial Number</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {challan.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground">
                        No goods recorded on this delivery challan.
                      </td>
                    </tr>
                  ) : (
                    challan.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono font-bold text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{item.productCode}</div>
                          <div className="text-xs text-muted-foreground">{item.productName}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {item.batchNumber ? <Badge variant="outline" className="bg-blue-50 text-blue-800">{item.batchNumber}</Badge> : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {item.serialNumberText ? <Badge variant="outline" className="bg-purple-50 text-purple-800">{item.serialNumberText}</Badge> : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                          {item.unitOfMeasure}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks & Statutory Footer */}
          {challan.remarks && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <span className="font-semibold">Remarks:</span> {challan.remarks}
            </div>
          )}

          <div className="pt-4 border-t text-[11px] text-muted-foreground flex justify-between">
            <span>* Statutory Delivery Note for goods transportation in transit.</span>
            <span>Issued By: {challan.issuedByUserName || 'System Administrator'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
