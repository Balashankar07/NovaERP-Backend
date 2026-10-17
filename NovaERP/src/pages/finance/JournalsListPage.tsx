import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/api/finance.api";
import { JournalEntry, JournalStatus, CreateJournalEntryDto, CreateJournalEntryLineDto } from "@/types/finance.types";
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

const getStatusBadge = (status: JournalStatus) => {
  switch (status) {
    case JournalStatus.Draft:
      return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
    case JournalStatus.Posted:
      return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" /> Posted</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function JournalsListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [description, setDescription] = useState("");
  const [debitAccId, setDebitAccId] = useState("");
  const [creditAccId, setCreditAccId] = useState("");
  const [amount, setAmount] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["journal-entries", page, search],
    queryFn: async () => {
      const res = await financeApi.getJournalEntries({ pageNumber: page, pageSize: 10, search });
      return res.data;
    }
  });

  const { data: coa } = useQuery({
    queryKey: ["coa-select"],
    queryFn: async () => {
      const res = await financeApi.getChartOfAccounts();
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateJournalEntryDto) => financeApi.createJournalEntry(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      setIsCreateOpen(false);
      resetForm();
    }
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => financeApi.postJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
    }
  });

  const resetForm = () => {
    setDescription("");
    setDebitAccId("");
    setCreditAccId("");
    setAmount(0);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !debitAccId || !creditAccId || amount <= 0 || debitAccId === creditAccId) return;

    const lines: CreateJournalEntryLineDto[] = [
      { accountId: debitAccId, debit: Number(amount), credit: 0, description: "Debit line" },
      { accountId: creditAccId, debit: 0, credit: Number(amount), description: "Credit line" }
    ];

    createMutation.mutate({
      entryDate: new Date().toISOString(),
      description,
      sourceDocumentType: "Manual",
      lines
    });
  };

  if (isLoading) return <LoadingView title="Loading General Ledger Journals..." />;
  if (isError) return <ErrorView title="Failed to load Journal Entries" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="General Ledger & Journal Entries"
        description="Double-entry journal records, automated integration postings and debit/credit balance verification."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <PermissionButton permission="Permissions.Finance.Journals.Create" size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Manual Journal
            </PermissionButton>
          </div>
        }
      />

      <SectionCard>
        <DataTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search journal entry numbers or descriptions..."
        />

        {!data || data.items.length === 0 ? (
          <EmptyState title="No Journal Entries" description="Manual or automated double-entry journals will appear here." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Total Debit</TableHead>
                  <TableHead>Total Credit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((j: JournalEntry) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{j.entryNumber}</TableCell>
                    <TableCell>{formatDate(j.entryDate)}</TableCell>
                    <TableCell className="max-w-xs truncate">{j.description}</TableCell>
                    <TableCell><Badge variant="outline">{j.sourceDocumentType || "Manual"}</Badge></TableCell>
                    <TableCell className="font-mono font-medium">{formatCurrency(j.totalDebit)}</TableCell>
                    <TableCell className="font-mono font-medium">{formatCurrency(j.totalCredit)}</TableCell>
                    <TableCell>{getStatusBadge(j.status)}</TableCell>
                    <TableCell className="text-right">
                      {j.status === JournalStatus.Draft && (
                        <PermissionButton
                          permission="Permissions.Finance.Journals.Post"
                          variant="outline"
                          size="sm"
                          onClick={() => postMutation.mutate(j.id)}
                          disabled={postMutation.isPending}
                        >
                          Post Journal
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

      {/* Manual Journal Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Balanced Journal Entry" size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <Label>Description</Label>
            <Input required value={description} onChange={e => setDescription(e.target.value)} placeholder="Adjustment / Entry Note" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Debit Account</Label>
              <Select value={debitAccId} onValueChange={setDebitAccId}>
                <SelectTrigger><SelectValue placeholder="Debit Account" /></SelectTrigger>
                <SelectContent>
                  {coa?.map(a => (
                    <SelectItem key={a.id} value={a.id}>[{a.accountCode}] {a.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Credit Account</Label>
              <Select value={creditAccId} onValueChange={setCreditAccId}>
                <SelectTrigger><SelectValue placeholder="Credit Account" /></SelectTrigger>
                <SelectContent>
                  {coa?.map(a => (
                    <SelectItem key={a.id} value={a.id}>[{a.accountCode}] {a.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Journal Amount ($)</Label>
            <Input type="number" step="0.01" min="0.01" required value={amount} onChange={e => setAmount(Number(e.target.value))} />
            <p className="text-xs text-slate-500 mt-1">Both Debit and Credit lines will be automatically balanced at ${amount}.</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || debitAccId === creditAccId}>Create Draft Entry</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
