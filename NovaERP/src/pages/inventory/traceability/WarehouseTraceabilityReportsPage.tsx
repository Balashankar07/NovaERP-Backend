import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { warehouseTraceabilityApi } from '@/api/warehouseTraceability.api';
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3, MapPin, Layers, CheckCircle2, AlertTriangle, ShieldAlert, Tag, ArrowRightLeft, FileSpreadsheet, Lock } from 'lucide-react';

export const WarehouseTraceabilityReportsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canViewReports = hasPermission("Permissions.Warehouse.Reports.View");

  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['warehouseTraceabilitySummary'],
    enabled: canViewReports,
    queryFn: async () => {
      const res = await warehouseTraceabilityApi.getReportsSummary();
      return res.data;
    }
  });

  if (!canViewReports) {
    return (
      <div className="p-6">
        <ErrorView
          icon={<Lock className="w-8 h-8 text-amber-500" />}
          title="Access Restricted"
          description="You do not have permission to view warehouse traceability reports."
        />
      </div>
    );
  }

  if (isLoading) return <LoadingView title="Loading traceability summary report..." />;
  if (error || !summary) return <ErrorView title="Failed to load traceability report" description={error ? (error as Error).message : "Data unavailable"} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Traceability & Location Reports"
        description="Comprehensive audit of warehouse storage topography, active batches, serial numbers, and stock status metrics."
        icon={<BarChart3 className="h-6 w-6 text-primary" />}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-muted/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hierarchical Locations</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalHierarchicalLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">Active Zones, Racks, Shelves & Bins</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Batches</CardTitle>
            <Layers className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.totalActiveBatches}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{summary.totalExpiredBatches} Expired</span>
              <span className="text-xs text-destructive font-medium">{summary.totalBlockedBatches} Blocked</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Serials</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.totalAvailableSerials}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.totalIssuedSerials} Issued / Delivered</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-muted/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Damaged Stock Serials</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.totalDamagedSerials}</div>
            <p className="text-xs text-muted-foreground mt-1">Excluded from operational stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Breakdown By Location */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Stock Distribution by Location Hierarchy
              </CardTitle>
              <CardDescription>
                Detailed breakdown of inventory quantities mapped to specific warehouse storage topography.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {summary.stockByLocation.length} Assigned Locations
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {summary.stockByLocation.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock currently assigned to specific hierarchical locations.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location Code</TableHead>
                  <TableHead>Location Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Products Stored</TableHead>
                  <TableHead className="text-right">Total Quantity On Hand</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.stockByLocation.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.warehouseName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {item.locationCode}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.locationName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{item.productCount}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {item.totalQuantityOnHand.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
