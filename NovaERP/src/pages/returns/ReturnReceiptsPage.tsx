import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { returnsApi } from '@/api/returns.api';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PackageCheck, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReturnReceiptsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: receipts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['return-receipts'],
    queryFn: () => returnsApi.getAllReceipts()
  });

  const filteredReceipts = receipts.filter(r => 
    r.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingView title="Loading Warehouse Return Receipts..." />;
  if (isError) return <ErrorView title="Failed to load return receipts" onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Return Receipts & Warehouse Inbound"
        description="Physical receiving, warehouse location entry, and auto-creation of Quality Inspection (Domain 6 Stage C)."
      />

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search by Receipt #, Return #, Product, or Warehouse..."
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
                  <th className="px-6 py-3">Receipt #</th>
                  <th className="px-6 py-3">Return #</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Qty Received</th>
                  <th className="px-6 py-3">Condition</th>
                  <th className="px-6 py-3">Warehouse / Location</th>
                  <th className="px-6 py-3">Received At</th>
                  <th className="px-6 py-3">Quality Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No return receipts logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        {item.receiptNumber}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">
                        <Link to={`/returns/requests/${item.customerReturnId}`} className="hover:underline text-blue-600">
                          {item.returnNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium">{item.productName}</td>
                      <td className="px-6 py-4 font-bold">{item.receivedQuantity}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{item.conditionName}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {item.warehouseName} {item.locationName ? `(${item.locationName})` : ''}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(item.receivedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {item.qualityInspectionId ? (
                          <Link to={`/quality/${item.qualityInspectionId}`} className="flex items-center gap-1 text-emerald-600 hover:underline">
                            <PackageCheck className="h-4 w-4" /> View Inspection
                          </Link>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-xs">
                            <ShieldAlert className="h-4 w-4" /> Pending Trigger
                          </span>
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
