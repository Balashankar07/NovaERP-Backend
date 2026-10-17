import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/api/finance.api";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { ArrowUpRight, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";

export function AccountsReceivablePage() {
  const { data: ar, isLoading, isError, refetch } = useQuery({
    queryKey: ["accounts-receivable"],
    queryFn: async () => {
      const res = await financeApi.getAccountsReceivableSummary();
      return res.data;
    }
  });

  if (isLoading) return <LoadingView title="Loading Accounts Receivable Summary..." />;
  if (isError || !ar) return <ErrorView title="Failed to load Accounts Receivable" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Accounts Receivable (AR)"
        description="Customer receivables ledger, outstanding customer invoices, collection analytics and balance tracking."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SectionCard className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Total Outstanding Receivables</p>
          <h3 className="text-2xl font-bold text-emerald-950 dark:text-emerald-100 mt-1">{formatCurrency(ar.totalOutstanding)}</h3>
        </SectionCard>

        <SectionCard className="p-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Collected Receipts</p>
          <h3 className="text-2xl font-bold text-blue-950 dark:text-blue-100 mt-1">{formatCurrency(ar.totalCollected)}</h3>
        </SectionCard>

        <SectionCard className="p-6 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Overdue Receivables Amount</p>
          <h3 className="text-2xl font-bold text-amber-950 dark:text-amber-100 mt-1">{formatCurrency(ar.overdueAmount)}</h3>
        </SectionCard>

        <SectionCard className="p-6 bg-slate-50/50 dark:bg-slate-900/20 border-slate-200">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Open Customer Invoices</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{ar.pendingInvoicesCount} Invoices</h3>
        </SectionCard>
      </div>

      <SectionCard title="Customer Outstanding Receivables Breakdown">
        {ar.invoices.length === 0 ? (
          <EmptyState title="No Outstanding Receivables" description="All customer invoices have been fully collected." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Amount Collected</TableHead>
                <TableHead>Balance Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ar.invoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-semibold">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.customerName}</TableCell>
                  <TableCell>{formatDate(inv.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(inv.totalAmount)}</TableCell>
                  <TableCell className="text-blue-600 font-medium">{formatCurrency(inv.amountPaid)}</TableCell>
                  <TableCell className="font-bold text-emerald-600">{formatCurrency(inv.balanceDue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </PageContainer>
  );
}
