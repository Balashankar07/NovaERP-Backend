import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { shipmentsApi } from "@/api/shipments.api";
import { CreateShipmentDto, CreateShipmentItemDto } from "@/types/shipments.types";
import { SalesOrderDto } from "@/types/sales.types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CreateShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrderDto;
  onSuccess: () => void;
}

interface FormValues {
  trackingNumber: string;
  courierName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    maxQuantity: number;
    selected: boolean;
  }[];
}

export function CreateShipmentDialog({ open, onOpenChange, salesOrder, onSuccess }: CreateShipmentDialogProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      trackingNumber: "",
      courierName: "",
      items: []
    }
  });

  const { fields } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");

  useEffect(() => {
    if (open) {
      const initialItems = salesOrder.items
        .map(i => {
          const remainingOrdered = i.quantity - i.shippedQuantity;
          const remainingReserved = i.reservedQuantity - i.shippedQuantity;
          const maxAllowed = Math.min(remainingOrdered, remainingReserved);
          
          return {
            productId: i.productId,
            productName: i.productName,
            quantity: maxAllowed, // Default to max allowed
            maxQuantity: maxAllowed,
            selected: maxAllowed > 0
          };
        })
        .filter(i => i.maxQuantity > 0);

      const dateStr = new Date().toISOString().replace(/\D/g, "").slice(0, 8);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const autoTracking = `TRK-${dateStr}-${randomSuffix}`;

      reset({
        trackingNumber: autoTracking,
        courierName: "FedEx",
        items: initialItems
      });
    }
  }, [open, salesOrder, reset]);

  const onSubmit = async (data: FormValues) => {
    const selectedItems = data.items.filter(i => i.selected);
    
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to ship.");
      return;
    }

    // Validate quantities
    for (const item of selectedItems) {
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        toast.error(`Quantity for ${item.productName} must be greater than 0.`);
        return;
      }
      if (qty > item.maxQuantity) {
        toast.error(`Quantity for ${item.productName} exceeds maximum allowed (${item.maxQuantity}).`);
        return;
      }
    }

    try {
      setLoading(true);
      const trackingNumber = data.trackingNumber?.trim() || `TRK-${new Date().toISOString().replace(/\D/g, "").slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload: CreateShipmentDto = {
        salesOrderId: salesOrder.id,
        trackingNumber: trackingNumber,
        courierName: data.courierName?.trim() || "FedEx",
        shipmentItems: selectedItems.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity)
        }))
      };

      await shipmentsApi.create(payload);
      toast.success("Shipment created successfully.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Create Shipment" size="3xl">
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input {...register("trackingNumber")} placeholder="Leave blank to auto-generate" />
            </div>
            <div className="space-y-2">
              <Label>Courier Name</Label>
              <Input {...register("courierName", { required: "Courier name is required" })} placeholder="e.g. FedEx, UPS" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Items to Ship</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Include</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Available to Ship</TableHead>
                  <TableHead className="w-32">Ship Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const maxQty = watchItems[index]?.maxQuantity;
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          {...register(`items.${index}.selected`)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{field.productName}</TableCell>
                      <TableCell className="text-right">{maxQty}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={maxQty}
                          disabled={!watchItems[index]?.selected}
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {fields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-4">
                      No items available to ship (either fully shipped or unreserved).
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fields.length === 0}>
              {loading ? "Creating..." : "Create Shipment"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
