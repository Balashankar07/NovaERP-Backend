import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryApi, warehousesApi, warehouseLocationsApi, WarehouseDto, WarehouseLocationDto, productsApi, ProductDto } from "@/api";
import { toast } from "@/utils/toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Receive Stock ---

const receiveSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  locationId: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  referenceType: z.string().min(1, "Reference Type is required"),
  referenceId: z.string().optional(),
  remarks: z.string().min(1, "Remarks are required")
});

export function ReceiveStockDialog({ open, onOpenChange, onSuccess, prefilledProductId, prefilledWarehouseId }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void, prefilledProductId?: string, prefilledWarehouseId?: string }) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [locations, setLocations] = useState<WarehouseLocationDto[]>([]);
  
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof receiveSchema>>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      productId: prefilledProductId || "",
      warehouseId: prefilledWarehouseId || "",
      referenceType: "Manual",
      quantity: 1,
      remarks: "Manual receipt"
    }
  });

  const selectedWarehouseId = watch("warehouseId");

  useEffect(() => {
    if (open) {
      fetchData();
      if (prefilledProductId) setValue("productId", prefilledProductId);
      if (prefilledWarehouseId) setValue("warehouseId", prefilledWarehouseId);
    } else {
      reset();
    }
  }, [open]);

  useEffect(() => {
    if (selectedWarehouseId) {
      warehouseLocationsApi.getByWarehouse(selectedWarehouseId).then(setLocations).catch(console.error);
    } else {
      setLocations([]);
    }
  }, [selectedWarehouseId]);

  const fetchData = async () => {
    try {
      const [pData, wData] = await Promise.all([
        productsApi.getAll({ pageSize: 1000 }),
        warehousesApi.getAll({ pageSize: 100 })
      ]);
      setProducts(pData.items);
      setWarehouses(wData.items);
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmit = async (data: z.infer<typeof receiveSchema>) => {
    try {
      await inventoryApi.receive(data);
      toast.success("Stock received successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to receive stock");
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Receive Stock">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Product</Label>
              <Controller name="productId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!prefilledProductId}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.productCode})</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.productId && <p className="text-xs text-rose-500">{errors.productId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Controller name="warehouseId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!prefilledWarehouseId}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.warehouseName}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.warehouseId && <p className="text-xs text-rose-500">{errors.warehouseId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Location (Optional)</Label>
              <Controller name="locationId" control={control} render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={(val) => field.onChange(val === "none" ? undefined : val)} disabled={!selectedWarehouseId}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.locationName}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" step="0.01" {...register("quantity")} className="bg-white border-slate-200" />
              {errors.quantity && <p className="text-xs text-rose-500">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Reference Type</Label>
              <Input {...register("referenceType")} className="bg-white border-slate-200" />
              {errors.referenceType && <p className="text-xs text-rose-500">{errors.referenceType.message}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Remarks</Label>
              <Input {...register("remarks")} className="bg-white border-slate-200" />
              {errors.remarks && <p className="text-xs text-rose-500">{errors.remarks.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">Receive</Button>
          </div>
        </form>
    </Modal>
  );
}

// --- Transfer Stock ---

const transferSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  sourceWarehouseId: z.string().min(1, "Source Warehouse is required"),
  sourceLocationId: z.string().optional(),
  destinationWarehouseId: z.string().min(1, "Destination Warehouse is required"),
  destinationLocationId: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  reason: z.string().min(1, "Reason is required")
}).refine(data => data.sourceWarehouseId !== data.destinationWarehouseId, {
  message: "Source and Destination warehouses must be different",
  path: ["destinationWarehouseId"]
});

export function TransferStockDialog({ open, onOpenChange, onSuccess, prefilledProductId, prefilledWarehouseId }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void, prefilledProductId?: string, prefilledWarehouseId?: string }) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  
  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      productId: prefilledProductId || "",
      sourceWarehouseId: prefilledWarehouseId || "",
      destinationWarehouseId: "",
      quantity: 1,
      reason: "Internal Warehouse Transfer"
    }
  });

  const sourceWarehouseId = watch("sourceWarehouseId");

  useEffect(() => {
    if (open) {
      fetchData();
      if (prefilledProductId) setValue("productId", prefilledProductId);
      if (prefilledWarehouseId) setValue("sourceWarehouseId", prefilledWarehouseId);
    } else {
      reset();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [pData, wData] = await Promise.all([
        productsApi.getAll({ pageSize: 1000 }),
        warehousesApi.getAll({ pageSize: 100 })
      ]);
      setProducts(pData.items);
      setWarehouses(wData.items);
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmit = async (data: z.infer<typeof transferSchema>) => {
    try {
      await inventoryApi.transfer(data);
      toast.success("Stock transferred successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to transfer stock");
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Warehouse Stock Transfer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Product</Label>
              <Controller name="productId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!prefilledProductId}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.productCode})</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.productId && <p className="text-xs text-rose-500">{errors.productId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Source Warehouse</Label>
              <Controller name="sourceWarehouseId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!prefilledWarehouseId}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Source warehouse" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.warehouseName}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.sourceWarehouseId && <p className="text-xs text-rose-500">{errors.sourceWarehouseId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Dest. Warehouse</Label>
              <Controller name="destinationWarehouseId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Dest warehouse" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.filter(w => w.id !== sourceWarehouseId).map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.warehouseName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.destinationWarehouseId && <p className="text-xs text-rose-500">{errors.destinationWarehouseId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" step="0.01" {...register("quantity")} className="bg-white border-slate-200" />
              {errors.quantity && <p className="text-xs text-rose-500">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Reason / Notes</Label>
              <Input {...register("reason")} className="bg-white border-slate-200" />
              {errors.reason && <p className="text-xs text-rose-500">{errors.reason.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">Execute Transfer</Button>
          </div>
        </form>
    </Modal>
  );
}

// --- Stock Adjustment / Cycle Count ---

const adjustSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  locationId: z.string().optional(),
  quantityDelta: z.coerce.number().refine(val => val !== 0, "Adjustment delta cannot be zero"),
  reason: z.string().min(1, "Reason is required")
});

export function AdjustStockDialog({ open, onOpenChange, onSuccess, prefilledProductId, prefilledWarehouseId }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void, prefilledProductId?: string, prefilledWarehouseId?: string }) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);

  const { register, handleSubmit, control, reset, setValue, formState: { errors, isSubmitting } } = useForm<z.infer<typeof adjustSchema>>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      productId: prefilledProductId || "",
      warehouseId: prefilledWarehouseId || "",
      quantityDelta: 1,
      reason: "Cycle count audit adjustment"
    }
  });

  useEffect(() => {
    if (open) {
      fetchData();
      if (prefilledProductId) setValue("productId", prefilledProductId);
      if (prefilledWarehouseId) setValue("warehouseId", prefilledWarehouseId);
    } else {
      reset();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [pData, wData] = await Promise.all([
        productsApi.getAll({ pageSize: 1000 }),
        warehousesApi.getAll({ pageSize: 100 })
      ]);
      setProducts(pData.items);
      setWarehouses(wData.items);
    } catch (e) {
      console.error(e);
    }
  };

  const onSubmit = async (data: z.infer<typeof adjustSchema>) => {
    try {
      await inventoryApi.adjust(data);
      toast.success("Stock adjusted successfully");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock");
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Stock Adjustment / Cycle Count">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Product</Label>
            <Controller name="productId" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={!!prefilledProductId}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.productCode})</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.productId && <p className="text-xs text-rose-500">{errors.productId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Controller name="warehouseId" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={!!prefilledWarehouseId}>
                <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.warehouseName}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            {errors.warehouseId && <p className="text-xs text-rose-500">{errors.warehouseId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Quantity Delta (+ or -)</Label>
            <Input type="number" step="0.01" {...register("quantityDelta")} className="bg-white border-slate-200" placeholder="+10 or -5" />
            {errors.quantityDelta && <p className="text-xs text-rose-500">{errors.quantityDelta.message}</p>}
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Adjustment Reason</Label>
            <Input {...register("reason")} className="bg-white border-slate-200" placeholder="Physical count variance / Damaged stock" />
            {errors.reason && <p className="text-xs text-rose-500">{errors.reason.message}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">Apply Adjustment</Button>
        </div>
      </form>
    </Modal>
  );
}

// Placeholders for Reserve and Release dialogs
export function IssueStockDialog(props: any) { return null; }
export function ReserveStockDialog(props: any) { return null; }
export function ReleaseReservationDialog(props: any) { return null; }
