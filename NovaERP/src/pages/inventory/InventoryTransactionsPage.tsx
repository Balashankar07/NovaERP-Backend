import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { inventoryApi, GlobalInventoryTransactionDto, warehousesApi, WarehouseDto } from "@/api";
import { formatDateTime } from "@/utils/formatters";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";

export function InventoryTransactionsPage() {
  const [transactions, setTransactions] = useState<GlobalInventoryTransactionDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [transactionType, setTransactionType] = useState<string>("all");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, search, selectedWarehouse, transactionType]);

  const fetchWarehouses = async () => {
    try {
      const data = await warehousesApi.getAll({ pageSize: 100 });
      setWarehouses(data.items);
    } catch (err: any) {
      console.error("Failed to fetch warehouses", err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { pageNumber: page, pageSize: 20 };
      if (search) params.search = search;
      if (selectedWarehouse && selectedWarehouse !== "all") params.warehouseId = selectedWarehouse;
      if (transactionType && transactionType !== "all") params.transactionType = transactionType;

      const data = await inventoryApi.getAllTransactions(params);
      setTransactions(data.items);
      setTotalPages(Math.ceil(data.totalCount / data.pageSize));
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading && transactions.length === 0) return <LoadingView title="Loading Transactions..." />;
    if (error) return <ErrorView message={error} onRetry={fetchTransactions} />;

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search products..."
              className="pl-9 bg-white border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.warehouseName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Receive">Receive</SelectItem>
                <SelectItem value="Issue">Issue</SelectItem>
                <SelectItem value="Reserve">Reserve</SelectItem>
                <SelectItem value="ReleaseReservation">Release Reservation</SelectItem>
                <SelectItem value="Adjust">Adjust</SelectItem>
                <SelectItem value="TransferOut">Transfer Out</SelectItem>
                <SelectItem value="TransferIn">Transfer In</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SectionCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700">Product</TableHead>
                  <TableHead className="font-semibold text-slate-700">Warehouse</TableHead>
                  <TableHead className="font-semibold text-slate-700">Type</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Qty</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Balance</TableHead>
                  <TableHead className="font-semibold text-slate-700">Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No transactions found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {formatDateTime(t.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{t.productName}</span>
                          <span className="text-xs text-slate-500">{t.productCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {t.warehouseName}
                        {t.locationName && <span className="text-xs text-slate-500 block">{t.locationName}</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          t.transactionType === 'Receive' || t.transactionType === 'TransferIn' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                          t.transactionType === 'Issue' || t.transactionType === 'TransferOut' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                          t.transactionType === 'Reserve' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                          t.transactionType === 'ReleaseReservation' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {t.transactionType}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${t.quantity > 0 ? 'text-emerald-600 font-semibold' : t.quantity < 0 ? 'text-rose-600 font-semibold' : 'text-slate-700'}`}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                      </TableCell>
                      <TableCell className="text-right text-slate-800 font-medium">{t.balanceAfter}</TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {t.referenceType}
                        {t.remarks && <span className="block text-xs text-slate-400 truncate max-w-[150px]" title={t.remarks}>{t.remarks}</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Inventory Transactions"
        description="View global transaction log across all warehouses."
      />
      {renderContent()}
    </PageContainer>
  );
}
