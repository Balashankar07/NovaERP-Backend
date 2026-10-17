import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '@/api/returns.api';
import { CustomerReturnStatus } from '@/types/returns.types';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Eye, Send, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerReturnsListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: returns = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['customer-returns', statusFilter],
    queryFn: () => returnsApi.getAllReturns(
      statusFilter !== 'ALL' ? parseInt(statusFilter) as CustomerReturnStatus : undefined
    )
  });

  const submitMutation = useMutation({
    mutationFn: returnsApi.submitReturn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-returns'] })
  });

  const approveMutation = useMutation({
    mutationFn: returnsApi.approveReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
      queryClient.invalidateQueries({ queryKey: ['rmas'] });
    }
  });

  const filteredReturns = returns.filter(r => 
    r.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.salesOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingView title="Loading Customer Returns..." />;
  if (isError) return <ErrorView title="Failed to load customer returns" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Customer Return Requests"
        description="View, submit, approve, and track customer return requests (Domain 6)."
        actions={
          <Button asChild className="gap-2">
            <Link to="/returns/requests/new">
              <Plus className="h-4 w-4" /> New Return Request
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <Input
              placeholder="Search by Return #, Customer, SO #, or Reason..."
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
                <SelectItem value={CustomerReturnStatus.Draft.toString()}>Draft</SelectItem>
                <SelectItem value={CustomerReturnStatus.Submitted.toString()}>Submitted</SelectItem>
                <SelectItem value={CustomerReturnStatus.Approved.toString()}>Approved</SelectItem>
                <SelectItem value={CustomerReturnStatus.Rejected.toString()}>Rejected</SelectItem>
                <SelectItem value={CustomerReturnStatus.Completed.toString()}>Completed</SelectItem>
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
                  <th className="px-6 py-3">Return #</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Sales Order #</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">RMA #</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Requested Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No customer return requests found.
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-mono font-medium">
                        <Link to={`/returns/requests/${item.id}`} className="text-primary hover:underline">
                          {item.returnNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium">{item.customerName}</td>
                      <td className="px-6 py-4 font-mono">{item.salesOrderNumber}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={item.reason}>
                        {item.reason}
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-600">
                        {item.rma ? item.rma.rmaNumber : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{item.statusName}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(item.requestedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button asChild variant="ghost" size="sm" title="View Details">
                          <Link to={`/returns/requests/${item.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>

                        {item.status === CustomerReturnStatus.Draft && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => submitMutation.mutate(item.id)}
                            disabled={submitMutation.isPending}
                            title="Submit Return"
                            className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Send className="h-3.5 w-3.5" /> Submit
                          </Button>
                        )}

                        {item.status === CustomerReturnStatus.Submitted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMutation.mutate(item.id)}
                            disabled={approveMutation.isPending}
                            title="Approve & Generate RMA"
                            className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          >
                            <FileCheck className="h-3.5 w-3.5" /> Approve & RMA
                          </Button>
                        )}
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
