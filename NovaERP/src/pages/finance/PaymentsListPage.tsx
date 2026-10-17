import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/api/finance.api";
import { Payment, PaymentType, PaymentMethod, PaymentStatus, RecordPaymentDto } from "@/types/finance.types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Plus, CheckCircle, Clock, RefreshCw } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.Recorded:
      return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Recorded</Badge>;
    case PaymentStatus.Approved:
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" /> Approved & Posted</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function PaymentsListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  // Form state
  const [payType, setPayType] = useState<PaymentType>(PaymentType.CustomerPayment);
  const [custInvId, setCustInvId] = useState("");
  const [suppInvId, setSuppInvId] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.BankTransfer);
  const [refNo, setRefNo] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["payments", page, search],
    queryFn: async () => {
      const res = await financeApi.getPayments({ pageNumber: page, pageSize: 10, search });
      return res.data;
    }
  });

  const { data: custInvoices } = useQuery({
    queryKey: ["cust-inv-select"],
    queryFn: async () => {
      const res = await financeApi.getCustomerInvoices({ pageNumber: 1, pageSize: 100 });
      return res.data.items.filter(i => i.balanceDue > 0);
    }
  });

  const { data: suppInvoices } = useQuery({
    queryKey: ["supp-inv-select"],
    queryFn: async () => {
      const res = await financeApi.getSupplierInvoices({ pageNumber: 1, pageSize: 100 });
      return res.data.items.filter(i => i.balanceDue > 0);
    }
  });

  const recordMutation = useMutation({
    mutationFn: (dto: RecordPaymentDto) => financeApi.recordPayment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      setIsRecordOpen(false);
      resetForm();
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => financeApi.approvePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["customer-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-payable"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    }
  });

  const resetForm = () => {
    setCustInvId("");
    setSuppInvId("");
    setAmount(0);
    setRefNo("");
    setNotes("");
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    recordMutation.mutate({
      type: payType,
      customerInvoiceId: payType === PaymentType.CustomerPayment ? custInvId : undefined,
      supplierInvoiceId: payType === PaymentType.SupplierPayment ? suppInvId : undefined,
      paymentDate: new Date().toISOString(),
      amount: Number(amount),
      paymentMethod: method,
      transactionReference: refNo,
      notes
    });
  };

  if (isLoading) return <LoadingView title="Loading Payments Ledger..." />;
  if (isError) return <ErrorView title="Failed to load Payments" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Payment Ledger"
        description="Record customer receipts, supplier disbursements, payment approvals and cash movements."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <PermissionButton permission="Permissions.Finance.Payments.Create" size="sm" onClick={() => setIsRecordOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Record Payment
            </PermissionButton>
          </div>
        }
      />

      <SectionCard>
        <DataTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search payment numbers or references..."
        />

        {!data || data.items.length === 0 ? (
          <EmptyState title="No Payments Recorded" description="Record a new customer or supplier payment." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice Linked</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((p: Payment) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold">{p.paymentNumber}</TableCell>
                    <TableCell>
                      {p.type === PaymentType.CustomerPayment ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Receipt (AR)</Badge>
                      ) : (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-200">Disbursement (AP)</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.type === PaymentType.CustomerPayment ? p.customerInvoiceNumber : p.supplierInvoiceNumber}
                    </TableCell>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right">
                      {p.status === PaymentStatus.Recorded && (
                        <PermissionButton
                          permission="Permissions.Finance.Payments.Approve"
                          variant="outline"
                          size="sm"
                          onClick={() => approveMutation.mutate(p.id)}
                          disabled={approveMutation.isPending}
                        >
                          Approve Payment
                        </PermissionButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4">
              <Pagination data={data} onPageChange={setPage} />
            </div>
          </>
        )}
      </SectionCard>

      {/* Record Payment Modal */}
      <Modal isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} title="Record Payment" size="lg">
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <Label>Payment Direction / Type</Label>
            <Select value={String(payType)} onValueChange={v => setPayType(Number(v) as PaymentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(PaymentType.CustomerPayment)}>Customer Payment (Receipt)</SelectItem>
                <SelectItem value={String(PaymentType.SupplierPayment)}>Supplier Payment (Disbursement)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {payType === PaymentType.CustomerPayment ? (
            <div>
              <Label>Select Customer Invoice</Label>
              <Select value={custInvId} onValueChange={setCustInvId}>
                <SelectTrigger><SelectValue placeholder="Choose Invoice" /></SelectTrigger>
                <SelectContent>
                  {custInvoices?.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.invoiceNumber} - {i.customerName} (Bal: ${i.balanceDue})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label>Select Supplier Invoice</Label>
              <Select value={suppInvId} onValueChange={setSuppInvId}>
                <SelectTrigger><SelectValue placeholder="Choose Invoice" /></SelectTrigger>
                <SelectContent>
                  {suppInvoices?.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.invoiceNumber} - {i.supplierName} (Bal: ${i.balanceDue})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Amount ($)</Label>
              <Input type="number" step="0.01" min="0.01" required value={amount} onChange={e => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={String(method)} onValueChange={v => setMethod(Number(v) as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(PaymentMethod.BankTransfer)}>Bank Transfer</SelectItem>
                  <SelectItem value={String(PaymentMethod.CreditCard)}>Credit Card</SelectItem>
                  <SelectItem value={String(PaymentMethod.Check)}>Check</SelectItem>
                  <SelectItem value={String(PaymentMethod.Cash)}>Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Transaction Reference / Cheque #</Label>
            <Input value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="TRX-99881122" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={recordMutation.isPending}>Record Payment</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
