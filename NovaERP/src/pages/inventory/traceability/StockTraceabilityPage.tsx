import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { warehouseTraceabilityApi } from "@/api/warehouseTraceability.api";
import { productsApi } from "@/api/products.api";
import { Search, GitCommit, Boxes, QrCode, ArrowRight } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";

export function StockTraceabilityPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const { data: products } = useQuery({
    queryKey: ["products-trace-dropdown"],
    queryFn: async () => {
      const res = await productsApi.getAll({ pageSize: 100 });
      if (res.data?.items?.length && !selectedProductId) {
        setSelectedProductId(res.data.items[0].id);
      }
      return res.data?.items || [];
    },
  });

  const { data: traceNode, isLoading, isError, refetch } = useQuery({
    queryKey: ["product-traceability-timeline", selectedProductId],
    enabled: !!selectedProductId,
    queryFn: async () => {
      const res = await warehouseTraceabilityApi.getProductTraceability(selectedProductId);
      return res.data;
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="End-to-End Stock Traceability"
        description="Audit product lifecycle timeline connecting Batch Lots, Serial Units, Bins, Movements, and Reference Documents."
      />

      <SectionCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[300px]"
            >
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.productCode} - SKU: {p.sku})
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingView title="Tracing Inventory Movements..." />
        ) : isError ? (
          <ErrorView title="Failed to load traceability timeline" onRetry={() => refetch()} />
        ) : !traceNode ? (
          <EmptyState icon={<GitCommit className="w-6 h-6 text-indigo-500" />} title="No Product Selected" description="Select a product above to inspect full traceability." />
        ) : (
          <div className="space-y-6">
            {/* Header Badge */}
            <div className="p-4 bg-slate-50 border rounded-lg flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{traceNode.productName}</h3>
                <p className="text-xs font-mono text-slate-500">Product Code: {traceNode.productCode}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold mr-2">Tracking Mode:</span>
                <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {traceNode.trackingMode}
                </span>
              </div>
            </div>

            {/* Batches & Serials Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batches Pill Box */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-3">
                  <Boxes className="w-4 h-4 text-indigo-600" /> Linked Lot / Batches ({traceNode.batches?.length || 0})
                </div>
                {!traceNode.batches?.length ? (
                  <p className="text-xs text-slate-400 italic">No lot batches registered for this product.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {traceNode.batches.map((b) => (
                      <div key={b.id} className="p-2.5 rounded border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-indigo-600">{b.batchNumber}</span>
                          <span className="text-slate-500 ml-2">({b.warehouseName})</span>
                        </div>
                        <span className="font-mono font-bold">Qty: {b.quantityOnHand}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Serials Pill Box */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-3">
                  <QrCode className="w-4 h-4 text-indigo-600" /> Linked Unit Serials ({traceNode.serials?.length || 0})
                </div>
                {!traceNode.serials?.length ? (
                  <p className="text-xs text-slate-400 italic">No serial numbers registered for this product.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {traceNode.serials.map((s) => (
                      <div key={s.id} className="p-2.5 rounded border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-indigo-600">{s.serialNumber}</span>
                          <span className="text-slate-500 ml-2">({s.status})</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{new Date(s.receivedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Movement Timeline */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-indigo-600" /> Persisted Movement Ledger
              </h4>

              {!traceNode.movements?.length ? (
                <EmptyState icon={<GitCommit className="w-6 h-6 text-indigo-500" />} title="No Movement Logs" description="No inventory transactions recorded for this product." />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Warehouse / Location</TableHead>
                        <TableHead className="text-right">Quantity Delta</TableHead>
                        <TableHead className="text-right">Balance After</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {traceNode.movements.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-mono text-xs text-slate-600">{new Date(m.timestamp).toLocaleString()}</TableCell>
                          <TableCell className="font-semibold text-slate-900">{m.transactionType}</TableCell>
                          <TableCell className="text-slate-500 text-xs">
                            {m.referenceType} {m.referenceId ? `(${m.referenceId.substring(0, 8)}...)` : ""}
                          </TableCell>
                          <TableCell className="text-slate-700 text-sm">
                            <div>{m.warehouseName}</div>
                            <div className="text-xs text-slate-400">{m.locationName}</div>
                          </TableCell>
                          <TableCell className={`text-right font-mono font-bold ${m.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900">{m.balanceAfter}</TableCell>
                          <TableCell className="text-slate-500 text-xs">{m.remarks || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
}
