import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, AlertTriangle, CheckCircle2, ArrowRightLeft, SlidersHorizontal } from "lucide-react";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { inventoryApi, InventoryDto, warehousesApi, WarehouseDto } from "@/api";
import { ReceiveStockDialog, TransferStockDialog, AdjustStockDialog } from "./components/MovementDialogs";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";

export function InventoryStockPage() {
  const [items, setItems] = useState<InventoryDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [page, search, selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const data = await warehousesApi.getAll({ pageSize: 100 });
      setWarehouses(data.items);
    } catch (err: any) {
      console.error("Failed to fetch warehouses", err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { pageNumber: page, pageSize: 15, search };
      let data;
      if (selectedWarehouse && selectedWarehouse !== "all") {
        data = await inventoryApi.getByWarehouse(selectedWarehouse, params);
      } else {
        data = await inventoryApi.getAll(params);
      }
      setItems(data.items);
      setTotalPages(Math.ceil(data.totalCount / data.pageSize));
    } catch (err: any) {
      setError(err.message || "Failed to fetch inventory stock.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading && items.length === 0) return <LoadingView title="Loading Stock Levels..." />;
    if (error) return <ErrorView message={error} onRetry={fetchInventory} />;

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-4 w-full sm:w-auto">
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
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700" onClick={() => setReceiveOpen(true)}>
              <Plus className="h-4 w-4 text-emerald-600" /> Receive Stock
            </Button>
            <Button variant="outline" className="gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft className="h-4 w-4 text-indigo-600" /> Transfer Stock
            </Button>
            <Button variant="outline" className="gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700" onClick={() => setAdjustOpen(true)}>
              <SlidersHorizontal className="h-4 w-4 text-amber-600" /> Adjust Stock
            </Button>
          </div>
        </div>

        <SectionCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-700">Product</TableHead>
                  <TableHead className="font-semibold text-slate-700">Warehouse</TableHead>
                  <TableHead className="font-semibold text-slate-700">Location</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">On Hand</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Reserved</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Available</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No stock levels found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{item.productName}</span>
                          <span className="text-xs text-slate-500">{item.productCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium">{item.warehouseName}</TableCell>
                      <TableCell className="text-slate-600">{item.locationName || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-slate-900 tabular-nums">{item.quantityOnHand}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-600 tabular-nums">{item.quantityReserved}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 tabular-nums">{item.quantityAvailable}</TableCell>
                      <TableCell>
                        {item.quantityAvailable <= item.minimumLevel ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            OK
                          </span>
                        )}
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
        title="Stock Levels"
        description="View and manage current inventory stock across all warehouses."
      />
      {renderContent()}

      <ReceiveStockDialog 
        open={receiveOpen} 
        onOpenChange={setReceiveOpen} 
        onSuccess={fetchInventory} 
      />
      <TransferStockDialog 
        open={transferOpen} 
        onOpenChange={setTransferOpen} 
        onSuccess={fetchInventory} 
      />
      <AdjustStockDialog 
        open={adjustOpen} 
        onOpenChange={setAdjustOpen} 
        onSuccess={fetchInventory} 
      />
    </PageContainer>
  );
}
