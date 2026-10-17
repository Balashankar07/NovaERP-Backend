import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { logisticsDocumentsApi } from '@/api/logisticsDocuments.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Package, Truck, Receipt, CheckCircle, Clock } from 'lucide-react';

export const LogisticsDocumentReportsPage: React.FC = () => {
  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ['logistics-documents-overview'],
    queryFn: () => logisticsDocumentsApi.getOverview(),
  });

  if (isLoading) return <LoadingView title="Loading Logistics Document Analytics & Reports..." />;
  if (isError || !overview) return <ErrorView title="Failed to load logistics document reports" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Logistics & Commercial Document Analytics"
        description="Comprehensive compliance reports, document status distributions, and statutory dispatch metrics (Domain 8)."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" /> Packing List Status Breakdown
            </CardTitle>
            <CardDescription>Outbound shipment packing documentation volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-sm font-medium">Total Packing Lists Generated</span>
              <span className="font-mono font-bold text-lg">{overview.totalPackingLists}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50/60 dark:bg-amber-900/20 rounded-lg">
              <span className="text-sm font-medium text-amber-800">Draft Packing Lists</span>
              <Badge variant="outline" className="text-amber-700 border-amber-300 font-mono font-bold">{overview.draftPackingLists}</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-emerald-50/60 dark:bg-emerald-900/20 rounded-lg">
              <span className="text-sm font-medium text-emerald-800">Officially Issued Packing Lists</span>
              <Badge className="bg-emerald-600 font-mono font-bold">{overview.issuedPackingLists}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" /> Delivery Challan Status Breakdown
            </CardTitle>
            <CardDescription>Statutory consignment transport notes volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="text-sm font-medium">Total Delivery Challans Issued</span>
              <span className="font-mono font-bold text-lg">{overview.totalDeliveryChallans}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50/60 dark:bg-amber-900/20 rounded-lg">
              <span className="text-sm font-medium text-amber-800">Draft Delivery Challans</span>
              <Badge variant="outline" className="text-amber-700 border-amber-300 font-mono font-bold">{overview.draftDeliveryChallans}</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-emerald-50/60 dark:bg-emerald-900/20 rounded-lg">
              <span className="text-sm font-medium text-emerald-800">Officially Issued Challans</span>
              <Badge className="bg-emerald-600 font-mono font-bold">{overview.issuedDeliveryChallans}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
