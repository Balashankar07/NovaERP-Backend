import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/api/finance.api";
import { CustomerInvoice, InvoiceStatus, CreateCustomerInvoiceDto } from "@/types/finance.types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Plus, CheckCircle, XCircle, FileText, Clock, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { PermissionButton } from "@/components/common/permission-button";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const getStatusBadge = (status: InvoiceStatus) => {
  switch (status) {
    case InvoiceStatus.Draft:
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
    case InvoiceStatus.Approved:
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" /> Approved</Badge>;
    case InvoiceStatus.PartiallyPaid:
      return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Partial</Badge>;
    case InvoiceStatus.Paid:
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
    case InvoiceStatus.Cancelled:
      return <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function CustomerInvoicesListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer-invoices", page, search],
    queryFn: async () => {
      const res = await financeApi.getCustomerInvoices({ pageNumber: page, pageSize: 10, search });
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateCustomerInvoiceDto) => financeApi.createCustomerInvoice(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      setIsCreateOpen(false);
      resetForm();
      toast.success("Customer invoice created successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create customer invoice");
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => financeApi.approveCustomerInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
      toast.success("Customer invoice approved and posted to General Ledger");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to approve customer invoice");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => financeApi.cancelCustomerInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      toast.success("Customer invoice cancelled");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to cancel customer invoice");
    }
  });

  const resetForm = () => {
    setCustomerName("");
    setCustomerAddress("");
    setTaxRate(0);
    setItemDesc("");
    setItemQty(1);
    setItemPrice(0);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Please enter Customer Name");
      return;
    }
    if (!itemDesc.trim()) {
      toast.error("Please enter a line item description");
      return;
    }
    if (itemQty <= 0) {
      toast.error("Quantity must be at least 1");
      return;
    }
    if (itemPrice < 0) {
      toast.error("Unit price cannot be negative");
      return;
    }
    createMutation.mutate({
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      taxRate: Number(taxRate),
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      items: [{ description: itemDesc.trim(), quantity: Number(itemQty), unitPrice: Number(itemPrice) }]
    });
  };

  if (isLoading) return <LoadingView title="Loading Customer Invoices..." />;
  if (isError) return <ErrorView title="Failed to load Customer Invoices" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Customer Invoices"
        description="Manage Order-to-Cash billing, tax calculations, approval lifecycles and customer balances."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <PermissionButton permission="Permissions.Finance.Invoices.Create" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Create Invoice
            </PermissionButton>
          </div>
        }
      />

      <SectionCard>
        <DataTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search invoices or customers..."
        />

        {!data || data.items.length === 0 ? (
          <EmptyState title="No Customer Invoices" description="Create a new customer invoice to record sales billing." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((inv: CustomerInvoice) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.customerName}</TableCell>
                    <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">{formatCurrency(inv.balanceDue)}</TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {inv.status === InvoiceStatus.Draft && (
                        <PermissionButton
                          permission="Permissions.Finance.Invoices.Approve"
                          variant="outline"
                          size="sm"
                          onClick={() => approveMutation.mutate(inv.id)}
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </PermissionButton>
                      )}
                      {(inv.status === InvoiceStatus.Draft || inv.status === InvoiceStatus.Approved) && inv.amountPaid === 0 && (
                        <PermissionButton
                          permission="Permissions.Finance.Invoices.Cancel"
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelMutation.mutate(inv.id)}
                          disabled={cancelMutation.isPending}
                          className="text-rose-600"
                        >
                          Cancel
                        </PermissionButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4">
              <Pagination
                data={data}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </SectionCard>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Customer Invoice" size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <Label>Customer Name</Label>
            <Input required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Acme Corp" />
          </div>
          <div>
            <Label>Customer Address</Label>
            <Input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="123 Business Way" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tax Rate (%)</Label>
              <Input type="number" step="0.01" min="0" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
            </div>
          </div>
          <div className="border-t pt-4">
            <Label className="font-semibold">Line Item Details</Label>
            <div className="space-y-2 mt-2">
              <Input required value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="Product / Service Description" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" min="1" required value={itemQty} onChange={e => setItemQty(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Unit Price ($)</Label>
                  <Input type="number" step="0.01" min="0" required value={itemPrice} onChange={e => setItemPrice(Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createMutation.isPending ? "Saving..." : "Save Draft Invoice"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
