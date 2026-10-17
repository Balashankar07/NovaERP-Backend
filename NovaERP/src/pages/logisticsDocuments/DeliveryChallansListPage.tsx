import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logisticsDocumentsApi } from '@/api/logisticsDocuments.api';
import { DeliveryChallan } from '@/types/logisticsDocuments.types';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Truck, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DeliveryChallansListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: challans = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['delivery-challans'],
    queryFn: () => logisticsDocumentsApi.getDeliveryChallans(),
  });

  const filtered = challans.filter(item => {
    const matchesSearch = 
      item.challanNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.carrier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <LoadingView title="Loading Delivery Challans..." />;
  if (isError) return <ErrorView title="Failed to load delivery challans" onRetry={refetch} />;

  const getStatusBadge = (status: string) => {
    if (status === 'Issued') return <Badge className="bg-emerald-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Issued</Badge>;
    if (status === 'Cancelled') return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
    return <Badge variant="outline" className="text-amber-700 border-amber-300"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Delivery Challans Directory"
        description="Official statutory delivery notes issued for carrier movement, vehicle transport, and consignment dispatch."
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <Input
              placeholder="Search by Challan #, Shipment Tracking, Carrier, or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3">Challan Number</th>
                  <th className="px-6 py-3">Shipment / Sales Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Carrier / Vehicle #</th>
                  <th className="px-6 py-3">Issue Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No delivery challans match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">
                        <Link to={`/logistics/delivery-challans/${item.id}`} className="hover:underline">
                          {item.challanNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-blue-700 font-semibold">{item.trackingNumber}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {item.customerName}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        <div>{item.carrier}</div>
                        {item.vehicleNumber && <div className="font-mono text-muted-foreground">{item.vehicleNumber}</div>}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(item.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/logistics/delivery-challans/${item.id}`}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
