import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '@/api/returns.api';
import { ReplacementOrder, ReplacementStatus, CreateReplacementDto } from '@/types/returns.types';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Plus, Send, CheckCircle, Truck } from 'lucide-react';
import { toast } from 'sonner';

export const ReturnReplacementsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateReplacementDto>({
    returnId: '',
    productId: '',
    quantity: 1,
    sourceWarehouseId: '',
    notes: '',
  });

  const { data: replacementsResponse, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['replacements', statusFilter],
    queryFn: () => returnsApi.getReplacements(statusFilter !== 'all' ? statusFilter as ReplacementStatus : undefined),
  });

  const { data: returnsResponse } = useQuery({
    queryKey: ['customer-returns', 'Approved'],
    queryFn: () => returnsApi.getReturns('Approved'),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateReplacementDto) => returnsApi.createReplacement(dto),
    onSuccess: () => {
      toast.success('Replacement order created & stock reserved successfully');
      queryClient.invalidateQueries({ queryKey: ['replacements'] });
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setCreateDialogOpen(false);
      setFormData({ returnId: '', productId: '', quantity: 1, sourceWarehouseId: '', notes: '' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create replacement order');
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => returnsApi.dispatchReplacement(id),
    onSuccess: () => {
      toast.success('Replacement shipment dispatched successfully');
      queryClient.invalidateQueries({ queryKey: ['replacements'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to dispatch replacement shipment');
    },
  });

  const replacements: ReplacementOrder[] = Array.isArray(replacementsResponse) ? replacementsResponse : (replacementsResponse?.data || []);
  const approvedReturns = Array.isArray(returnsResponse) ? returnsResponse : (returnsResponse?.data || []);

  const getStatusBadge = (status: ReplacementStatus) => {
    switch (status) {
      case ReplacementStatus.StockReserved:
        return <Badge className="bg-blue-600 text-white">Stock Reserved</Badge>;
      case ReplacementStatus.ShipmentCreated:
        return <Badge className="bg-indigo-600 text-white">Shipment Created</Badge>;
      case ReplacementStatus.Dispatched:
        return <Badge className="bg-purple-600 text-white">Dispatched</Badge>;
      case ReplacementStatus.Delivered:
        return <Badge className="bg-emerald-600 text-white">Delivered</Badge>;
      case ReplacementStatus.Cancelled:
        return <Badge variant="outline" className="text-gray-500">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleReturnSelect = (returnId: string) => {
    const selectedReturn = approvedReturns.find(r => r.id === returnId);
    if (selectedReturn && selectedReturn.items && selectedReturn.items.length > 0) {
      setFormData(prev => ({
        ...prev,
        returnId,
        productId: selectedReturn.items[0].productId,
        quantity: selectedReturn.items[0].quantity,
      }));
    } else {
      setFormData(prev => ({ ...prev, returnId }));
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.returnId || !formData.productId || formData.quantity <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  if (isLoading) return <LoadingView title="Loading replacement orders..." />;
  if (isError || error) return <ErrorView title="Failed to load replacement orders" onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Replacement Orders"
        description="Manage stock reservation, replacement order fulfillment, and shipment dispatch for returned products"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Replacement Order
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Replacements ({replacements.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="statusFilter" className="text-sm font-medium">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="statusFilter" className="w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={ReplacementStatus.StockReserved}>Stock Reserved</SelectItem>
                  <SelectItem value={ReplacementStatus.ShipmentCreated}>Shipment Created</SelectItem>
                  <SelectItem value={ReplacementStatus.Dispatched}>Dispatched</SelectItem>
                  <SelectItem value={ReplacementStatus.Delivered}>Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Replacement Order #</TableHead>
                <TableHead>Return #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Shipment Tracking #</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replacements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No replacement orders found.
                  </TableCell>
                </TableRow>
              ) : (
                replacements.map((repl) => (
                  <TableRow key={repl.id}>
                    <TableCell className="font-mono font-medium">{repl.replacementNumber}</TableCell>
                    <TableCell className="font-mono">{repl.returnNumber}</TableCell>
                    <TableCell>{repl.productName || repl.productId.substring(0, 8)}</TableCell>
                    <TableCell className="font-semibold">{repl.quantity}</TableCell>
                    <TableCell>{getStatusBadge(repl.status)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {repl.shipmentTrackingNumber ? (
                        <span className="flex items-center gap-1 text-indigo-600">
                          <Truck className="h-3 w-3" /> {repl.shipmentTrackingNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not Shipped</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(repl.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(repl.status === ReplacementStatus.StockReserved || repl.status === ReplacementStatus.ShipmentCreated) && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={dispatchMutation.isPending}
                          onClick={() => dispatchMutation.mutate(repl.id)}
                        >
                          <Send className="mr-1 h-3.5 w-3.5" /> Dispatch Shipment
                        </Button>
                      )}
                      {repl.status === ReplacementStatus.Dispatched && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          In Transit
                        </Badge>
                      )}
                      {repl.status === ReplacementStatus.Delivered && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 justify-end font-medium">
                          <CheckCircle className="h-3.5 w-3.5" /> Delivered
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Replacement Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Replacement Order</DialogTitle>
            <DialogDescription>
              Reserve inventory stock and initialize shipment for customer replacement product.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returnId">Select Approved Return *</Label>
              <Select value={formData.returnId} onValueChange={handleReturnSelect}>
                <SelectTrigger id="returnId">
                  <SelectValue placeholder="Select Return Request" />
                </SelectTrigger>
                <SelectContent>
                  {approvedReturns.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.returnNumber} - Customer: {r.customerName || r.customerId.substring(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product ID *</Label>
                <Input
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                  placeholder="Product GUID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Replacement Qty *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceWarehouseId">Source Warehouse ID (Optional)</Label>
              <Input
                id="sourceWarehouseId"
                value={formData.sourceWarehouseId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceWarehouseId: e.target.value }))}
                placeholder="Source Warehouse GUID for stock reservation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Instructions</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Fulfillment instructions, stock reservation notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Reserving Stock...' : 'Reserve Stock & Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
