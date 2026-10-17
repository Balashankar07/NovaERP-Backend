import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseTraceabilityApi } from "@/api/warehouseTraceability.api";
import { productsApi } from "@/api/products.api";
import { warehousesApi } from "@/api/warehouses.api";
import { InventoryBatch, CreateInventoryBatchDto, BatchStatus } from "@/types/warehouseTraceability.types";
import { Boxes, Plus, ShieldAlert, Tag, Edit2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

export function BatchesListPage() {
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusModalBatch, setStatusModalBatch] = useState<InventoryBatch | null>(null);
  const [newStatus, setNewStatus] = useState<BatchStatus>("Active");

  const [formData, setFormData] = useState<CreateInventoryBatchDto>({
    batchNumber: "",
    productId: "",
    warehouseId: "",
    initialQuantity: 100,
    manufactureDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });

  const queryClient = useQueryClient();

  const { data: batchesData, isLoading, isError, refetch } = useQuery({
    queryKey: ["warehouse-batches", page, selectedProduct, selectedStatus],
    queryFn: async () => {
      const res = await warehouseTraceabilityApi.getBatches({
        pageNumber: page,
        pageSize: 15,
        productId: selectedProduct || undefined,
        status: selectedStatus !== "" ? (parseInt(selectedStatus) as BatchStatus) : undefined,
      });
      return res.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-dropdown"],
    queryFn: async () => {
      const res = await productsApi.getAll({ pageSize: 100 });
      return res.data?.items || [];
    },
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses-dropdown-batches"],
    queryFn: async () => {
      const res = await warehousesApi.getAll({ pageSize: 100 });
      return res.data?.items || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateInventoryBatchDto) => warehouseTraceabilityApi.createBatch(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-batches"] });
      toast.success("Inventory batch created successfully");
      setIsCreateOpen(false);
      setFormData({
        batchNumber: "",
        productId: "",
        warehouseId: "",
        initialQuantity: 100,
        manufactureDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create inventory batch");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ batchId, status }: { batchId: string; status: BatchStatus }) =>
      warehouseTraceabilityApi.updateBatchStatus(batchId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-batches"] });
      toast.success("Batch status updated successfully");
      setStatusModalBatch(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update batch status");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchNumber || !formData.productId || !formData.warehouseId) {
      toast.warning("Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  if (isLoading) return <LoadingView title="Loading Inventory Batches..." />;
  if (isError) return <ErrorView title="Failed to load Batches" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Batch & Lot Inventory Directory"
        description="Monitor lot lifecycle, manufacturing/expiry dates, and allocation status per batch."
        actions={
          <PermissionButton
            permission="Permissions.Warehouse.Batches.Create"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Create Batch
          </PermissionButton>
        }
      />

      <SectionCard className="p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Products</option>
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.productCode})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="0">Active</option>
            <option value="1">Quarantine</option>
            <option value="2">Expired</option>
            <option value="3">Blocked</option>
            <option value="4">Damaged</option>
          </select>
        </div>

        {!batchesData?.items?.length ? (
          <EmptyState
            icon={Boxes}
            title="No Inventory Batches Found"
            description="Create your first lot/batch record to enable batch traceability."
            action={
              <PermissionButton
                permission="Permissions.Warehouse.Batches.Create"
                onClick={() => setIsCreateOpen(true)}
              >
                Create Batch
              </PermissionButton>
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse / Location</TableHead>
                  <TableHead className="text-center">Dates (Mfg / Exp)</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchesData.items.map((batch: InventoryBatch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono font-bold text-indigo-600">
                      <div>{batch.batchNumber}</div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3 text-slate-400" /> {batch.barcode || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{batch.productName}</div>
                      <div className="text-xs font-mono text-slate-500">{batch.productCode}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div>{batch.warehouseName}</div>
                      <div className="text-xs text-slate-400">{batch.locationName || "Warehouse Level"}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      <div>Mfg: {batch.manufactureDate ? new Date(batch.manufactureDate).toLocaleDateString() : "—"}</div>
                      <div className={batch.status === "Expired" || batch.status === 2 ? "text-rose-600 font-bold" : "text-slate-500"}>
                        Exp: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">{batch.quantityOnHand}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-600">{batch.quantityAvailable}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        batch.status === "Active" || batch.status === 0
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : batch.status === "Quarantine" || batch.status === 1
                          ? "text-amber-700 bg-amber-50 border-amber-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}>
                        {batch.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <PermissionButton
                        permission="Permissions.Warehouse.Batches.Update"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStatusModalBatch(batch);
                          setNewStatus(batch.status);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </PermissionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Create Batch Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Inventory Batch / Lot"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <Label htmlFor="batchNumber">Batch / Lot Number *</Label>
            <Input
              id="batchNumber"
              placeholder="e.g. LOT-2026-0921-A"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Product *</Label>
              <select
                id="product"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Product...</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.productCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="warehouse">Warehouse *</Label>
              <select
                id="warehouse"
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Warehouse...</option>
                {warehouses?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName} ({w.warehouseCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="initialQuantity">Quantity *</Label>
              <Input
                id="initialQuantity"
                type="number"
                value={formData.initialQuantity}
                onChange={(e) => setFormData({ ...formData, initialQuantity: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="mfgDate">Manufacture Date</Label>
              <Input
                id="mfgDate"
                type="date"
                value={formData.manufactureDate || ""}
                onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expDate">Expiry Date</Label>
              <Input
                id="expDate"
                type="date"
                value={formData.expiryDate || ""}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Save Batch"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Batch Status Modal */}
      {statusModalBatch && (
        <Modal
          isOpen={!!statusModalBatch}
          onClose={() => setStatusModalBatch(null)}
          title={`Update Batch Status — ${statusModalBatch.batchNumber}`}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="batchStatus">Status</Label>
              <select
                id="batchStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Quarantine">Quarantine</option>
                <option value="Expired">Expired</option>
                <option value="Blocked">Blocked</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setStatusModalBatch(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => statusMutation.mutate({ batchId: statusModalBatch.id, status: newStatus })}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? "Saving..." : "Update Status"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
