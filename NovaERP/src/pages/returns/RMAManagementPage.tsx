import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '@/api/returns.api';
import { RmaStatus } from '@/types/returns.types';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RMAManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: rmas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['rmas', statusFilter],
    queryFn: () => returnsApi.getAllRmas(
      statusFilter !== 'ALL' ? parseInt(statusFilter) as RmaStatus : undefined
    )
  });

  const authorizeMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      returnsApi.authorizeRma(id, { approve, reason: approve ? 'Authorized' : 'Rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmas'] });
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
    }
  });

  const filteredRmas = rmas.filter(r => 
    r.rmaNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.authorizedByName && r.authorizedByName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <LoadingView title="Loading Return Material Authorizations (RMAs)..." />;
  if (isError) return <ErrorView title="Failed to load RMA records" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="RMA Management (Return Material Authorization)"
        description="Authorize, reject, and inspect customer RMA numbers (Domain 6 Stage B)."
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <Input
              placeholder="Search by RMA #, Return #, or Authorizer..."
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
                <SelectItem value={RmaStatus.Draft.toString()}>Draft</SelectItem>
                <SelectItem value={RmaStatus.Submitted.toString()}>Submitted</SelectItem>
                <SelectItem value={RmaStatus.Authorized.toString()}>Authorized</SelectItem>
                <SelectItem value={RmaStatus.Received.toString()}>Received</SelectItem>
                <SelectItem value={RmaStatus.Rejected.toString()}>Rejected</SelectItem>
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
                  <th className="px-6 py-3">RMA #</th>
                  <th className="px-6 py-3">Return #</th>
                  <th className="px-6 py-3">Authorized By</th>
                  <th className="px-6 py-3">Authorization Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Instructions / Notes</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRmas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No RMA authorizations found.
                    </td>
                  </tr>
                ) : (
                  filteredRmas.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                        {item.rmaNumber}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-blue-600">
                        <Link to={`/returns/requests/${item.customerReturnId}`} className="hover:underline">
                          {item.returnNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4">{item.authorizedByName || 'System'}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(item.authorizationDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{item.statusName}</Badge>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-600" title={item.instructions || item.reason || ''}>
                        {item.instructions || item.reason || '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {item.status === RmaStatus.Submitted && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => authorizeMutation.mutate({ id: item.id, approve: true })}
                              disabled={authorizeMutation.isPending}
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => authorizeMutation.mutate({ id: item.id, approve: false })}
                              disabled={authorizeMutation.isPending}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </>
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
