import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '@/api/returns.api';
import { ReturnRepairStatus } from '@/types/returns.types';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReturnRepairsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: repairs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['return-repairs'],
    queryFn: () => returnsApi.getAllRepairs()
  });

  const approveMutation = useMutation({
    mutationFn: returnsApi.approveRepair,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['return-repairs'] })
  });

  const startMutation = useMutation({
    mutationFn: returnsApi.startRepair,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['return-repairs'] })
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => returnsApi.completeRepair(id, { passedReinspection: true, notes: 'Repair completed & passed quality reinspection' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['return-repairs'] })
  });

  const filteredRepairs = repairs.filter(r => 
    r.repairNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.assignedTechnicianName && r.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <LoadingView title="Loading Customer Repair Requests..." />;
  if (isError) return <ErrorView title="Failed to load repair requests" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Customer Product Repairs"
        description="Bench repair execution, technician assignment, work center routing, and quality reinspection (Domain 6 Stage F)."
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search by Repair #, Return #, Product, or Technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3">Repair #</th>
                  <th className="px-6 py-3">Return #</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Technician</th>
                  <th className="px-6 py-3">Work Center</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Est. Hours</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No repair requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRepairs.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-cyan-700">
                        {item.repairNumber}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">
                        <Link to={`/returns/requests/${item.customerReturnId}`} className="hover:underline text-blue-600">
                          {item.returnNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium">{item.productName}</td>
                      <td className="px-6 py-4">{item.assignedTechnicianName || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-xs">{item.workCenterName || 'Bench 1'}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{item.statusName}</Badge>
                      </td>
                      <td className="px-6 py-4 font-bold">{item.estimatedRepairHours}h</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {item.status === ReturnRepairStatus.Pending && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMutation.mutate(item.id)}
                            disabled={approveMutation.isPending}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            Approve Repair
                          </Button>
                        )}

                        {item.status === ReturnRepairStatus.Approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startMutation.mutate(item.id)}
                            disabled={startMutation.isPending}
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          >
                            <Play className="h-3.5 w-3.5 mr-1" /> Start Repair
                          </Button>
                        )}

                        {item.status === ReturnRepairStatus.InRepair && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => completeMutation.mutate(item.id)}
                            disabled={completeMutation.isPending}
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" /> Complete & Reinspect
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
