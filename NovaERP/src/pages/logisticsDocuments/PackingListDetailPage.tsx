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
  Package, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Printer, 
  Building2, 
  Truck, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export const PackingListDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pl, isLoading, isError, refetch } = useQuery({
    queryKey: ['packing-list-detail', id],
    queryFn: () => logisticsDocumentsApi.getPackingListById(id!),
    enabled: !!id,
  });

  const issueMutation = useMutation({
    mutationFn: (plId: string) => logisticsDocumentsApi.issuePackingList(plId),
    onSuccess: () => {
      toast.success('Packing List Officially Issued');
      queryClient.invalidateQueries({ queryKey: ['packing-list-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['packing-lists'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-documents-overview'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to issue Packing List');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (plId: string) => logisticsDocumentsApi.cancelPackingList(plId),
    onSuccess: () => {
      toast.success('Packing List Cancelled');
      queryClient.invalidateQueries({ queryKey: ['packing-list-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['packing-lists'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-documents-overview'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel Packing List');
    },
  });

  if (isLoading) return <LoadingView title="Loading Packing List details..." />;
  if (isError || !pl) return <ErrorView title="Failed to load Packing List" onRetry={refetch} />;

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
        <Button variant="ghost" size="sm" onClick={() => navigate('/logistics/packing-lists')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Packing Lists
        </Button>
      </div>

      <PageHeader
        title={`Packing List: ${pl.packingListNumber}`}
        description={`Outbound shipment packing slip for Customer ${pl.customerName}`}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" /> Print Document View
            </Button>
            {pl.status === 'Draft' && (
              <>
                <Button 
                  onClick={() => issueMutation.mutate(pl.id)} 
                  disabled={issueMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Officially Issue PL
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => cancelMutation.mutate(pl.id)} 
                  disabled={cancelMutation.isPending}
                  className="gap-1.5"
                >
                  <XCircle className="h-4 w-4" /> Cancel PL
                </Button>
              </>
            )}
            {getStatusBadge(pl.status)}
          </div>
        }
      />

      {/* Structured Document View */}
      <Card className="print:border-none print:shadow-none">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="h-6 w-6 text-indigo-600" /> PACKING LIST
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">NovaERP Reverse Logistics & Shipping</div>
            </div>
            <div className="text-right font-mono text-sm">
              <div className="font-bold text-indigo-700">{pl.packingListNumber}</div>
              <div className="text-xs text-muted-foreground">Date: {new Date(pl.packingDate).toLocaleDateString()}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Header Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border">
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Customer / Consignee</div>
              <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">{pl.customerName}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Shipment Tracking #</div>
              <div className="font-mono font-bold text-blue-700 mt-1">{pl.trackingNumber}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Sales Order #</div>
              <div className="font-mono font-bold text-indigo-700 mt-1">{pl.orderNumber}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Total Packages</div>
              <div className="font-bold mt-1">{pl.totalPackages} pkg(s)</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Total Gross Weight</div>
              <div className="font-bold mt-1">{pl.totalWeightKg ? `${pl.totalWeightKg} kg` : 'N/A'}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Package Dimensions</div>
              <div className="font-bold mt-1">{pl.packageDimensions || 'N/A'}</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Packed Line Items & Traceability</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Pkg #</th>
                    <th className="px-4 py-3">Product Code / Name</th>
                    <th className="px-4 py-3">Batch Number</th>
                    <th className="px-4 py-3">Serial Number</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pl.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground">
                        No packed items recorded.
                      </td>
                    </tr>
                  ) : (
                    pl.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                          Pkg {item.packageNumber}
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
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {item.description || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Audit Footnote */}
          {pl.notes && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <span className="font-semibold">Notes:</span> {pl.notes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
