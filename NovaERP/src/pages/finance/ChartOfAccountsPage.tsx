import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/api/finance.api";
import { ChartOfAccount, AccountType, CreateChartOfAccountDto } from "@/types/finance.types";
import { formatCurrency } from "@/utils/formatters";
import { Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { PermissionButton } from "@/components/common/permission-button";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const getAccountTypeBadge = (type: AccountType) => {
  switch (type) {
    case AccountType.Asset:
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Asset</Badge>;
    case AccountType.Liability:
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Liability</Badge>;
    case AccountType.Equity:
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Equity</Badge>;
    case AccountType.Revenue:
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Revenue</Badge>;
    case AccountType.Expense:
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Expense</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export function ChartOfAccountsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>(AccountType.Asset);
  const [desc, setDesc] = useState("");

  const { data: accounts, isLoading, isError, refetch } = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: async () => {
      const res = await financeApi.getChartOfAccounts();
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateChartOfAccountDto) => financeApi.createChartOfAccount(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      setIsCreateOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setCode("");
    setName("");
    setType(AccountType.Asset);
    setDesc("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    createMutation.mutate({
      accountCode: code,
      accountName: name,
      type,
      description: desc
    });
  };

  if (isLoading) return <LoadingView title="Loading Chart of Accounts..." />;
  if (isError || !accounts) return <ErrorView title="Failed to load Chart of Accounts" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Chart of Accounts (COA)"
        description="Standard enterprise accounting structure, account classification and real-time ledger balance derivation."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <PermissionButton permission="Permissions.Finance.ChartOfAccounts.Manage" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Account
            </PermissionButton>
          </div>
        }
      />

      <SectionCard title="Active Accounts Register">
        {accounts.length === 0 ? (
          <EmptyState title="No Accounts Found" description="Create standard chart of accounts." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Derived Current Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc: ChartOfAccount) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">{acc.accountCode}</TableCell>
                  <TableCell className="font-semibold">{acc.accountName}</TableCell>
                  <TableCell>{getAccountTypeBadge(acc.type)}</TableCell>
                  <TableCell className="text-slate-500">{acc.description || "-"}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(acc.currentBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      {/* Create Account Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New Chart of Account" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Account Code</Label>
              <Input required value={code} onChange={e => setCode(e.target.value)} placeholder="1050" />
            </div>
            <div>
              <Label>Account Type</Label>
              <Select value={String(type)} onValueChange={v => setType(Number(v) as AccountType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(AccountType.Asset)}>Asset</SelectItem>
                  <SelectItem value={String(AccountType.Liability)}>Liability</SelectItem>
                  <SelectItem value={String(AccountType.Equity)}>Equity</SelectItem>
                  <SelectItem value={String(AccountType.Revenue)}>Revenue</SelectItem>
                  <SelectItem value={String(AccountType.Expense)}>Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Account Name</Label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Petty Cash" />
          </div>

          <div>
            <Label>Description</Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Account usage notes" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>Add Account</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
