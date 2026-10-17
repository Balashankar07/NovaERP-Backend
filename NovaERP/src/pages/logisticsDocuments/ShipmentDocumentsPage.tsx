import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logisticsDocumentsApi } from '@/api/logisticsDocuments.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Receipt, Package, Truck, ExternalLink, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ShipmentDocumentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ['logistics-documents-overview'],
    queryFn: () => logisticsDocumentsApi.getOverview(),
  });

  if (isLoading) return <LoadingView title="Loading Shipment Documents..." />;
  if (isError || !overview) return <ErrorView title="Failed to load shipment documents" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Shipment Document Manifests & Commercial Invoice Integration"
        description="Unified commercial and shipping document references linking Packing Lists, Delivery Challans, and Domain 1 Customer Invoices (Domain 8)."
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="h-4 w-4 text-indigo-600" /> Packing List Manifests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{overview.totalPackingLists}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.issuedPackingLists} officially issued PLs
            </p>
            <Button asChild variant="outline" size="sm" className="w-full mt-3">
              <Link to="/logistics/packing-lists">View All PLs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-blue-600" /> Delivery Challans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{overview.totalDeliveryChallans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.issuedDeliveryChallans} officially issued DCs
            </p>
            <Button asChild variant="outline" size="sm" className="w-full mt-3">
              <Link to="/logistics/delivery-challans">View All DCs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-emerald-600" /> Commercial Customer Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{overview.linkedInvoicesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Reused Domain 1 Finance Invoices
            </p>
            <Button asChild variant="outline" size="sm" className="w-full mt-3">
              <Link to="/finance">Go to Finance Invoices</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* GST E-Invoice & Statutory Boundary Safeguard Card */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2 text-base">
            <Info className="h-5 w-5 text-amber-600" /> Statutory & Government Integration Disclaimer
          </CardTitle>
          <CardDescription className="text-amber-800">
            Official system boundary notice for statutory compliance and commercial document generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-amber-900">
          <div className="flex justify-between py-1 border-b border-amber-200">
            <span className="font-semibold">GST e-Invoice API:</span>
            <span className="font-mono text-amber-800">NOT SUPPORTED BY BACKEND</span>
          </div>
          <div className="flex justify-between py-1 border-b border-amber-200">
            <span className="font-semibold">GST IRN Generation:</span>
            <span className="font-mono text-amber-800">NOT SUPPORTED BY BACKEND</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-semibold">E-way Bill API:</span>
            <span className="font-mono text-amber-800">NOT SUPPORTED BY BACKEND</span>
          </div>
          <p className="pt-2 text-[11px] text-amber-700">
            * All commercial invoice financial totals continue to be authoritatively managed by Domain 1 Finance (`CustomerInvoice`). Logistics documents reference real persisted invoices without creating duplicate invoice entities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
