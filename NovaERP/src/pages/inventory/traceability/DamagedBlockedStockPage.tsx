import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseTraceabilityApi } from "@/api/warehouseTraceability.api";
import { InventoryBatch, InventorySerialNumber, BatchStatus, SerialStatus } from "@/types/warehouseTraceability.types";
import { AlertTriangle, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

export function DamagedBlockedStockPage() {
  const [activeTab, setActiveTab] = useState<"batches" | "serials">("batches");
  const queryClient = useQueryClient();

  const { data: batchesData, isLoading: isLoadingBatches, isError: isErrorBatches, refetch: refetchBatches } = useQuery({
    queryKey: ["damaged-blocked-batches"],
    queryFn: async () => {
      const res = await warehouseTraceabilityApi.getDamagedOrBlockedBatches();
      return res.data?.items || [];
    },
  });

  const { data: serialsData, isLoading: isLoadingSerials, isError: isErrorSerials, refetch: refetchSerials } = useQuery({
    queryKey: ["damaged-blocked-serials"],
    queryFn: async () => {
      const res = await warehouseTraceabilityApi.getDamagedOrBlockedSerials();
      return res.data?.items || [];
    },
  });

  const restoreBatchMutation = useMutation({
    mutationFn: (batchId: string) =>
      warehouseTraceabilityApi.updateBatchStatus(batchId, { status: "Active" as BatchStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["damaged-blocked-batches"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-batches"] });
      toast.success("Batch restored to Active status");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to restore batch");
    },
  });

  const restoreSerialMutation = useMutation({
    mutationFn: (serialId: string) =>
      warehouseTraceabilityApi.updateSerialStatus(serialId, { status: "Available" as SerialStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["damaged-blocked-serials"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-serials"] });
      toast.success("Serial restored to Available status");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to restore serial");
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Damaged & Blocked Stock Control"
        description="Isolate defective, quarantined, or expired inventory from allocatable stock to prevent unauthorized operational issuance."
      />

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("batches")}
          className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "batches"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Damaged / Blocked Batches ({batchesData?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("serials")}
          className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "serials"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Damaged / Blocked Serials ({serialsData?.length || 0})
        </button>
      </div>

      <SectionCard className="p-6">
        {activeTab === "batches" ? (
          isLoadingBatches ? (
            <LoadingView title="Loading Blocked Batches..." />
          ) : isErrorBatches ? (
            <ErrorView title="Failed to load batches" onRetry={() => refetchBatches()} />
          ) : !batchesData?.length ? (
            <EmptyState
              icon={Lock}
              title="No Damaged or Blocked Batches"
              description="All active batches are operationally healthy and allocatable."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-center">Disposition Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchesData.map((batch: InventoryBatch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono font-bold text-rose-600">{batch.batchNumber}</TableCell>
                      <TableCell className="font-medium">{batch.productName} ({batch.productCode})</TableCell>
                      <TableCell className="text-slate-600">{batch.warehouseName}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{batch.quantityOnHand}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5" /> {batch.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <PermissionButton
                          permission="Permissions.Warehouse.BlockedStock.Manage"
                          variant="outline"
                          size="sm"
                          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1"
                          onClick={() => restoreBatchMutation.mutate(batch.id)}
                          disabled={restoreBatchMutation.isPending}
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Unblock Batch
                        </PermissionButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : isLoadingSerials ? (
          <LoadingView title="Loading Blocked Serials..." />
        ) : isErrorSerials ? (
          <ErrorView title="Failed to load serials" onRetry={() => refetchSerials()} />
        ) : !serialsData?.length ? (
          <EmptyState
            icon={Lock}
            title="No Damaged or Blocked Serials"
            description="No serial units marked as damaged or quarantined."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-center">Received Date</TableHead>
                  <TableHead className="text-center">Disposition Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serialsData.map((serial: InventorySerialNumber) => (
                  <TableRow key={serial.id}>
                    <TableCell className="font-mono font-bold text-rose-600">{serial.serialNumber}</TableCell>
                    <TableCell className="font-medium">{serial.productName} ({serial.productCode})</TableCell>
                    <TableCell className="text-slate-600">{serial.warehouseName}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{new Date(serial.receivedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> {serial.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <PermissionButton
                        permission="Permissions.Warehouse.DamagedStock.Manage"
                        variant="outline"
                        size="sm"
                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1"
                        onClick={() => restoreSerialMutation.mutate(serial.id)}
                        disabled={restoreSerialMutation.isPending}
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Restore Serial
                      </PermissionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
}
