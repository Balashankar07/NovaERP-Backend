import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@/api/finance.api";
import { formatCurrency } from "@/utils/formatters";
import { Landmark, ArrowUpRight, ArrowDownRight, DollarSign, BookOpen, Receipt, CreditCard, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";

export function FinanceDashboardPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ["finance-overview"],
    queryFn: async () => {
      const res = await financeApi.getSummary();
      return res.data;
    }
  });

  if (isLoading) return <LoadingView title="Loading Financial Overview..." />;
  if (isError || !summary) return <ErrorView title="Failed to load Finance Summary" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Finance & Commercial Accounting"
        description="Enterprise Financial Health, General Ledger, Accounts Payable, Accounts Receivable & Cash Flow Overview."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh Summary
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SectionCard className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Accounts Receivable (AR)</p>
              <h3 className="text-2xl font-bold text-emerald-950 dark:text-emerald-100 mt-1">
                {formatCurrency(summary.totalAccountsReceivable)}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                {summary.pendingCustomerInvoicesCount} Pending Customer Invoices
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-300">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-800 dark:text-rose-300">Accounts Payable (AP)</p>
              <h3 className="text-2xl font-bold text-rose-950 dark:text-rose-100 mt-1">
                {formatCurrency(summary.totalAccountsPayable)}
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                {summary.pendingSupplierInvoicesCount} Pending Supplier Invoices
              </p>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-xl text-rose-600 dark:text-rose-300">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Cash & Bank Position</p>
              <h3 className="text-2xl font-bold text-blue-950 dark:text-blue-100 mt-1">
                {formatCurrency(summary.totalCashAndBank)}
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Derived from Posted Ledger Entries
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-300">
              <Landmark className="w-6 h-6" />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Secondary Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SectionCard className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Net Sales Revenue</span>
          </div>
          <p className="text-xl font-semibold">{formatCurrency(summary.netSalesRevenue)}</p>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Cost of Goods Sold (COGS)</span>
          </div>
          <p className="text-xl font-semibold">{formatCurrency(summary.totalCostOfGoodsSold)}</p>
        </SectionCard>

        <SectionCard className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Journal Entries</span>
          </div>
          <p className="text-xl font-semibold">{summary.totalJournalEntriesCount} Posted & Draft Entries</p>
        </SectionCard>
      </div>

      {/* Module Navigation Grid */}
      <SectionCard className="p-6" title="Financial Modules & Quick Navigation">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center items-center" onClick={() => navigate(ROUTES.FINANCE_CUSTOMER_INVOICES)}>
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Customer Invoices</span>
          </Button>

          <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center items-center" onClick={() => navigate(ROUTES.FINANCE_SUPPLIER_INVOICES)}>
            <Receipt className="w-6 h-6 text-rose-600" />
            <span>Supplier Invoices</span>
          </Button>

          <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center items-center" onClick={() => navigate(ROUTES.FINANCE_PAYMENTS)}>
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span>Payments Ledger</span>
          </Button>

          <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center items-center" onClick={() => navigate(ROUTES.FINANCE_ACCOUNTS_PAYABLE)}>
            <ArrowDownRight className="w-6 h-6 text-amber-600" />
            <span>Accounts Payable</span>
          </Button>

          <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center items-center" onClick={() => navigate(ROUTES.FINANCE_ACCOUNTS_RECEIVABLE)}>
            <ArrowUpRight className="w-6 h-6 text-teal-600" />
            <span>Accounts Receivable</span>
          </Button>

          <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center items-center" onClick={() => navigate(ROUTES.FINANCE_CHART_OF_ACCOUNTS)}>
            <Landmark className="w-6 h-6 text-purple-600" />
            <span>Chart of Accounts</span>
          </Button>

          <Button variant="outline" className="h-24 flex flex-col gap-2 justify-center items-center" onClick={() => navigate(ROUTES.FINANCE_JOURNALS)}>
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>General Ledger</span>
          </Button>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
