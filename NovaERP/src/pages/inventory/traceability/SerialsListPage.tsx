import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseTraceabilityApi } from "@/api/warehouseTraceability.api";
import { productsApi } from "@/api/products.api";
import { warehousesApi } from "@/api/warehouses.api";
import { InventorySerialNumber, RegisterSerialNumbersDto, SerialStatus } from "@/types/warehouseTraceability.types";
import { QrCode, Plus, Tag, Edit2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

export function SerialsListPage() {
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [statusModalSerial, setStatusModalSerial] = useState<InventorySerialNumber | null>(null);
  const [newStatus, setNewStatus] = useState<SerialStatus>("Available");
  const [serialText, setSerialText] = useState("");

  const [registerData, setRegisterData] = useState<RegisterSerialNumbersDto>({
    productId: "",
    warehouseId: "",
    serialNumbers: [],
  });

  const queryClient = useQueryClient();

  const { data: serialsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["warehouse-serials", page, selectedProduct, selectedStatus],
    queryFn: async () => {
      const res = await warehouseTraceabilityApi.getSerials({
        pageNumber: page,
        pageSize: 15,
        productId: selectedProduct || undefined,
        status: selectedStatus !== "" ? (parseInt(selectedStatus) as SerialStatus) : undefined,
      });
      return res.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-dropdown-serials"],
    queryFn: async () => {
      const res = await productsApi.getAll({ pageSize: 100 });
      return res.data?.items || [];
    },
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses-dropdown-serials"],
    queryFn: async () => {
      const res = await warehousesApi.getAll({ pageSize: 100 });
      return res.data?.items || [];
    },
  });

  const registerMutation = useMutation({
    mutationFn: (dto: RegisterSerialNumbersDto) => warehouseTraceabilityApi.registerSerials(dto),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-serials"] });
      toast.success(`Registered ${res.data?.length || 0} serial numbers successfully`);
      setIsRegisterOpen(false);
      setSerialText("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to register serial numbers");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ serialId, status }: { serialId: string; status: SerialStatus }) =>
      warehouseTraceabilityApi.updateSerialStatus(serialId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-serials"] });
      toast.success("Serial number status updated successfully");
      setStatusModalSerial(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update serial status");
    },
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sns = serialText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (!registerData.productId || !registerData.warehouseId || !sns.length) {
      toast.warning("Product, Warehouse, and at least one Serial Number are required");
      return;
    }

    registerMutation.mutate({ ...registerData, serialNumbers: sns });
  };

  if (isLoading) return <LoadingView title="Loading Serial Numbers..." />;
  if (isError) return <ErrorView title="Failed to load Serial Numbers" onRetry={() => refetch()} />;

  return (
    <PageContainer>
      <PageHeader
        title="Unit-Level Serial Directory"
        description="Track individual unit serial lifecycle from receipt to customer issuance and warranty."
        actions={
          <PermissionButton
            permission="Permissions.Warehouse.Serials.Create"
            onClick={() => setIsRegisterOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Register Serials
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
            <option value="0">Available</option>
            <option value="1">Reserved</option>
            <option value="2">Issued</option>
            <option value="3">Damaged</option>
            <option value="4">Blocked</option>
            <option value="5">Returned</option>
          </select>
        </div>

        {!serialsData?.items?.length ? (
          <EmptyState
            icon={QrCode}
            title="No Serial Numbers Registered"
            description="Register unit serial numbers to track individualized inventory movements."
            action={
              <PermissionButton
                permission="Permissions.Warehouse.Serials.Create"
                onClick={() => setIsRegisterOpen(true)}
              >
                Register Serials
              </PermissionButton>
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse / Location</TableHead>
                  <TableHead>Batch / Lot</TableHead>
                  <TableHead className="text-center">Dates (Received / Issued)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serialsData.items.map((sn: InventorySerialNumber) => (
                  <TableRow key={sn.id}>
                    <TableCell className="font-mono font-bold text-indigo-600">
                      <div>{sn.serialNumber}</div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3 text-slate-400" /> {sn.barcode || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{sn.productName}</div>
                      <div className="text-xs font-mono text-slate-500">{sn.productCode}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div>{sn.warehouseName}</div>
                      <div className="text-xs text-slate-400">{sn.locationName || "Warehouse Level"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      {sn.batchNumber || "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      <div>Rec: {new Date(sn.receivedAt).toLocaleDateString()}</div>
                      <div className="text-slate-500">
                        Iss: {sn.issuedAt ? new Date(sn.issuedAt).toLocaleDateString() : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        sn.status === "Available" || sn.status === 0
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : sn.status === "Reserved" || sn.status === 1
                          ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                          : sn.status === "Issued" || sn.status === 2
                          ? "text-blue-700 bg-blue-50 border-blue-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}>
                        {sn.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <PermissionButton
                        permission="Permissions.Warehouse.Serials.Update"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStatusModalSerial(sn);
                          setNewStatus(sn.status);
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

      {/* Register Serials Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Unit Serial Numbers"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serialProduct">Product *</Label>
              <select
                id="serialProduct"
                value={registerData.productId}
                onChange={(e) => setRegisterData({ ...registerData, productId: e.target.value })}
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
              <Label htmlFor="serialWarehouse">Warehouse *</Label>
              <select
                id="serialWarehouse"
                value={registerData.warehouseId}
                onChange={(e) => setRegisterData({ ...registerData, warehouseId: e.target.value })}
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

          <div>
            <Label htmlFor="serialText">Serial Numbers (One per line) *</Label>
            <textarea
              id="serialText"
              rows={5}
              placeholder="SN-10001&#10;SN-10002&#10;SN-10003"
              value={serialText}
              onChange={(e) => setSerialText(e.target.value)}
              className="w-full p-3 text-sm font-mono rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Registering..." : "Register Serials"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Serial Status Modal */}
      {statusModalSerial && (
        <Modal
          isOpen={!!statusModalSerial}
          onClose={() => setStatusModalSerial(null)}
          title={`Update Serial Status — ${statusModalSerial.serialNumber}`}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="serialStatus">Status</Label>
              <select
                id="serialStatus"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Issued">Issued</option>
                <option value="Damaged">Damaged</option>
                <option value="Blocked">Blocked</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setStatusModalSerial(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => statusMutation.mutate({ serialId: statusModalSerial.id, status: newStatus })}
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
