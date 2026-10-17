import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { returnsApi } from '@/api/returns.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReturnDispositionPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: dispositions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['return-dispositions'],
    queryFn: () => returnsApi.getAllDispositions()
  });

  const filteredDispositions = dispositions.filter(d => 
    d.dispositionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.dispositionTypeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingView title="Loading Returned Item Dispositions..." />;
  if (isError) return <ErrorView title="Failed to load disposition records" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Returned Item Dispositions"
        description="Track restock, bench repair, scrap write-off, and customer replacement decisions (Domain 6 Stage E)."
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search by Disposition #, Return #, Type, or Product..."
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
                  <th className="px-6 py-3">Disposition #</th>
                  <th className="px-6 py-3">Return #</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Qty</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created Date</th>
                  <th className="px-6 py-3">Notes / Action Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDispositions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No disposition records recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredDispositions.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-amber-600">
                        {item.dispositionNumber}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">
                        <Link to={`/returns/requests/${item.customerReturnId}`} className="hover:underline text-blue-600">
                          {item.returnNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium">{item.productName}</td>
                      <td className="px-6 py-4 font-semibold text-purple-700">
                        {item.dispositionTypeName}
                      </td>
                      <td className="px-6 py-4 font-bold">{item.quantity}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{item.statusName}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-600" title={item.notes || ''}>
                        {item.notes || '—'}
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
