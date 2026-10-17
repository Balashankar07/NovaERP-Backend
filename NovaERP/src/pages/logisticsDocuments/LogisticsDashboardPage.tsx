import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { logisticsDocumentsApi } from '@/api/logisticsDocuments.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Truck, 
  Package, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LogisticsDashboardPage: React.FC = () => {
  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ['logistics-documents-overview'],
    queryFn: () => logisticsDocumentsApi.getOverview(),
  });

  if (isLoading) return <LoadingView title="Loading Logistics Documents Control Center..." />;
  if (isError || !overview) return <ErrorView title="Failed to load logistics documents overview" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Logistics & Commercial Documents Control Center"
        description="Persisted, traceable Packing Lists, Delivery Challans, and Shipment Document manifests linked to Sales Orders, Shipments, and Finance Invoices (Domain 8)."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/logistics/packing-lists">
                <Package className="h-4 w-4 mr-1.5" /> Packing Lists
              </Link>
            </Button>
            <Button asChild className="gap-1 bg-indigo-600 hover:bg-indigo-700">
              <Link to="/logistics/delivery-challans">
                <Truck className="h-4 w-4 mr-1.5" /> Delivery Challans
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Packing Lists</CardTitle>
            <Package className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalPackingLists}</div>
            <div className="flex gap-2 mt-1.5 text-xs">
              <span className="text-amber-700 font-semibold">{overview.draftPackingLists} Draft</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{overview.issuedPackingLists} Issued</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Challans</CardTitle>
            <Truck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalDeliveryChallans}</div>
            <div className="flex gap-2 mt-1.5 text-xs">
              <span className="text-amber-700 font-semibold">{overview.draftDeliveryChallans} Draft</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{overview.issuedDeliveryChallans} Issued</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shipment Manifests</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalShipmentDocuments}</div>
            <p className="text-xs text-muted-foreground mt-1.5">Registered document references</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Finance Invoices Linked</CardTitle>
            <Receipt className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.linkedInvoicesCount}</div>
            <p className="text-xs text-muted-foreground mt-1.5">Reused Domain 1 Customer Invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Module Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packing Lists Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" /> Stage A — Packing List Operations
            </CardTitle>
            <CardDescription>
              Backend-generated PL-YYYYMMDD-XXXX documents capturing package counts, weights, dimensions, and item serial/batch numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Total Draft PLs:</span>
                <Badge variant="outline" className="text-amber-700 border-amber-300">{overview.draftPackingLists}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Total Issued PLs:</span>
                <Badge className="bg-emerald-600">{overview.issuedPackingLists}</Badge>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link to="/logistics/packing-lists">
                  View Packing Lists <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Challans Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" /> Stage B — Delivery Challan Operations
            </CardTitle>
            <CardDescription>
              Statutory shipment dispatch notes capturing carriers, vehicle numbers, destination addresses, and product line quantities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Total Draft Challans:</span>
                <Badge variant="outline" className="text-amber-700 border-amber-300">{overview.draftDeliveryChallans}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Total Issued Challans:</span>
                <Badge className="bg-emerald-600">{overview.issuedDeliveryChallans}</Badge>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link to="/logistics/delivery-challans">
                  View Delivery Challans <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
