import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { returnsApi } from '@/api/returns.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  RotateCcw, 
  FileCheck2, 
  PackageCheck, 
  Wrench, 
  Truck, 
  TrendingUp, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReturnsDashboardPage: React.FC = () => {
  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ['returns-summary'],
    queryFn: returnsApi.getSummaryReport
  });

  if (isLoading) return <LoadingView title="Loading Reverse Logistics Dashboard..." />;
  if (isError) return <ErrorView title="Failed to load reverse logistics summary" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Reverse Logistics & Return Management"
        description="Comprehensive customer return processing, RMA authorization, warehouse receipts, quality disposition, bench repairs, and replacement shipments."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customer Returns</CardTitle>
            <RotateCcw className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalReturns || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active & processed return requests
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RMA Authorizations</CardTitle>
            <FileCheck2 className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.approvedRmas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.pendingRmas || 0} pending authorization
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Warehouse Receipts</CardTitle>
            <PackageCheck className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalReceipts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items received into physical stock
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customer Bench Repairs</CardTitle>
            <Wrench className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.completedRepairs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.inRepairs || 0} active bench repairs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-blue-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-600" /> Customer Return Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Initiate and manage return requests from customers linked to delivered sales orders and serial/batch traceability.
            </p>
            <Link 
              to="/returns/requests" 
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Manage Return Requests &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-emerald-600" /> RMA Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Authorize or reject Return Material Authorizations (RMA) with specific customer instructions and warranty claim resolution.
            </p>
            <Link 
              to="/returns/rmas" 
              className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-800"
            >
              View RMAs &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-purple-600" /> Return Receipts & Inspection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Receive physical returned items at warehouse docks and trigger automated quality inspection workflows.
            </p>
            <Link 
              to="/returns/receipts" 
              className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
            >
              Process Return Receipts &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-600" /> Bench Repairs & Quality Reinspection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Assign technicians to repair returned goods and perform formal quality reinspection before restoring inventory status.
            </p>
            <Link 
              to="/returns/repairs" 
              className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-800"
            >
              Manage Bench Repairs &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-indigo-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600" /> Replacement Shipments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reserve replacement inventory stock, issue shipments, and track replacement delivery for customer resolution.
            </p>
            <Link 
              to="/returns/replacements" 
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Process Replacements &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-rose-500 transition-colors">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-rose-600" /> Reverse Logistics Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Track return volume, disposition rates (Restock, Repair, Scrap, Replacement), and cost analysis across product lines.
            </p>
            <Link 
              to="/returns/reports" 
              className="inline-flex items-center text-sm font-medium text-rose-600 hover:text-rose-800"
            >
              View Reverse Logistics Reports &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
