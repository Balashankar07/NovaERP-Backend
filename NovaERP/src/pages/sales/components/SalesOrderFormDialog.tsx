import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { salesApi } from "@/api/sales.api";
import { CreateSalesOrderDto, UpdateSalesOrderDto, SalesOrderDto } from "@/types/sales.types";
import { distributorsApi } from "@/api/distributors.api";
import { productsApi } from "@/api/products.api";
import { ProductType } from "@/types/products.types";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search } from "lucide-react";

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  searchPlaceholder: string;
}

function SearchableSelect({ value, onValueChange, options, placeholder, searchPlaceholder }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find(o => o.value === value);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open} 
          className="w-full justify-between font-normal hover:bg-transparent min-w-0 overflow-hidden text-left"
        >
          <span className="truncate flex-1 min-w-0 text-left mr-2" title={selectedOption ? selectedOption.label : placeholder}>
            {selectedOption ? selectedOption.label : <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] p-0" align="start" sideOffset={4}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No options found.</div>
          ) : (
            filtered.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => {
                  onValueChange(opt.value);
                  setSearch("");
                }}
                className={`cursor-pointer ${value === opt.value ? "bg-accent text-accent-foreground" : ""}`}
              >
                {opt.label}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SalesOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderToEdit?: SalesOrderDto | null;
  onSuccess: () => void;
}

export function SalesOrderFormDialog({
  open,
  onOpenChange,
  orderToEdit,
  onSuccess,
}: SalesOrderFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const isEditing = !!orderToEdit;

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateSalesOrderDto>({
    defaultValues: {
      distributorId: "",
      requiredDeliveryDate: "",
      currency: "USD",
      shippingAddress: "",
      billingAddress: "",
      remarks: "",
      items: [{ productId: "", quantity: 1, unitPrice: 0, unit: "ea", discount: 0, tax: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (open) {
      loadData();
      if (orderToEdit) {
        reset({
          distributorId: orderToEdit.distributorId,
          requiredDeliveryDate: orderToEdit.requiredDeliveryDate?.substring(0,10) || "",
          currency: orderToEdit.currency || "USD",
          shippingAddress: orderToEdit.shippingAddress || "",
          billingAddress: orderToEdit.billingAddress || "",
          remarks: orderToEdit.remarks || "",
          items: orderToEdit.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            unit: i.unit || "ea",
            discount: i.discount || 0,
            tax: i.tax || 0,
          })),
        });
      } else {
        reset({
          distributorId: "",
          requiredDeliveryDate: "",
          currency: "USD",
          shippingAddress: "",
          billingAddress: "",
          remarks: "",
          items: [{ productId: "", quantity: 1, unitPrice: 0, unit: "ea", discount: 0, tax: 0 }],
        });
      }
    }
  }, [open, orderToEdit, reset]);

  const loadData = async () => {
    try {
      const [distResult, prodResult] = await Promise.all([
        distributorsApi.getDistributors({ pageSize: 1000 }),
        productsApi.getAll({ pageSize: 1000 })
      ]);
      setDistributors(distResult?.items || []);
      setProducts(prodResult?.items?.filter((p: any) => p.productType === ProductType.FinishedGood || p.productType === 1 || p.productType === "FinishedGood") || []); // Only FinishedGoods
    } catch (err) {
      // API error handled silently or via other means
    }
  };

  const onSubmit = async (data: CreateSalesOrderDto) => {
    setApiError(null);

    if (!data.distributorId) {
      setApiError("Please select a Customer (Distributor).");
      return;
    }
    if (!data.items || data.items.length === 0) {
      setApiError("Please add at least one line item.");
      return;
    }
    if (data.items.some(i => !i.productId)) {
      setApiError("Please select a product for all line items.");
      return;
    }
    if (data.items.some(i => !i.quantity || isNaN(Number(i.quantity)) || Number(i.quantity) <= 0)) {
      setApiError("All item quantities must be greater than 0.");
      return;
    }
    if (data.items.some(i => isNaN(Number(i.unitPrice)) || Number(i.unitPrice) < 0)) {
      setApiError("Unit price cannot be negative.");
      return;
    }

    setLoading(true);
    try {
      // Format date
      if (data.requiredDeliveryDate) {
        data.requiredDeliveryDate = new Date(data.requiredDeliveryDate).toISOString();
      } else {
        delete data.requiredDeliveryDate;
      }
      
      data.items = data.items.map(i => ({
        ...i,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount || 0),
        tax: Number(i.tax || 0),
      }));

      if (isEditing) {
        await salesApi.updateSalesOrder(orderToEdit.id, data as UpdateSalesOrderDto);
      } else {
        await salesApi.createSalesOrder(data);
      }
      onSuccess();
    } catch (err: any) {
      setApiError(err.message || "Failed to save sales order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} title={isEditing ? "Edit Sales Order" : "New Sales Order"} size="5xl">
      <div className="max-h-[75vh] overflow-y-auto pr-2">
        {apiError && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {apiError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 min-w-0">
              <Label>Customer (Distributor) *</Label>
              <SearchableSelect
                value={watch("distributorId")}
                onValueChange={(val) => setValue("distributorId", val)}
                placeholder="Select Customer"
                searchPlaceholder="Search customers/distributors..."
                options={distributors.map((d) => ({
                  value: d.id,
                  label: `${d.companyName} (${d.contactPerson})`
                }))}
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label>Required Delivery Date</Label>
              <Input 
                type="date" 
                min={new Date().toISOString().split("T")[0]}
                {...register("requiredDeliveryDate", {
                  validate: (val) => !val || new Date(val) >= new Date(new Date().setHours(0,0,0,0)) || "Required delivery date cannot be in the past"
                })} 
              />
              {errors.requiredDeliveryDate && <p className="text-xs text-rose-500 font-medium">{errors.requiredDeliveryDate.message}</p>}
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label>Currency</Label>
              <Input {...register("currency")} placeholder="USD" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label>Billing Address</Label>
              <Textarea rows={2} className="min-h-[52px] resize-none" {...register("billingAddress")} placeholder="Billing Address..." />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label>Shipping Address</Label>
              <Textarea rows={2} className="min-h-[52px] resize-none" {...register("shippingAddress")} placeholder="Shipping Address..." />
            </div>

            <div className="col-span-2 space-y-1.5 min-w-0">
              <Label>Remarks</Label>
              <Textarea rows={2} className="min-h-[52px] resize-none" {...register("remarks")} placeholder="Any specific instructions..." />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Order Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: "", quantity: 1, unitPrice: 0, unit: "ea", discount: 0, tax: 0 })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              <div className="grid grid-cols-12 gap-2 px-3 py-2.5 bg-slate-50 font-medium text-xs text-slate-600 uppercase tracking-wider">
                <div className="col-span-4 min-w-0">Product *</div>
                <div className="col-span-2 min-w-0">Quantity *</div>
                <div className="col-span-2 min-w-0">Unit Price *</div>
                <div className="col-span-1 min-w-0 text-center">Disc.</div>
                <div className="col-span-1 min-w-0 text-center">Tax</div>
                <div className="col-span-1 min-w-0 text-right pr-1">Total</div>
                <div className="col-span-1 min-w-0 text-center">Action</div>
              </div>

              {fields.map((field, index) => {
                const qty = watch(`items.${index}.quantity`) || 0;
                const price = watch(`items.${index}.unitPrice`) || 0;
                const discount = watch(`items.${index}.discount`) || 0;
                const tax = watch(`items.${index}.tax`) || 0;
                const total = (qty * price) - discount + tax;

                return (
                  <div key={field.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-slate-50/50 transition-colors">
                    <div className="col-span-4 min-w-0">
                      <SearchableSelect
                        value={watch(`items.${index}.productId`)}
                        onValueChange={(val) => {
                          setValue(`items.${index}.productId`, val);
                          const prod = products.find(p => p.id === val);
                          if (prod) setValue(`items.${index}.unitPrice`, prod.sellingPrice);
                        }}
                        placeholder="Select Product"
                        searchPlaceholder="Search products..."
                        options={products.map((p) => ({
                          value: p.id,
                          label: `${p.name} (${p.sku})`
                        }))}
                      />
                    </div>
                    <div className="col-span-2 min-w-0">
                      <Input type="number" min="0.01" step="0.01" className="h-9" {...register(`items.${index}.quantity`)} />
                    </div>
                    <div className="col-span-2 min-w-0">
                      <Input type="number" min="0" step="0.01" className="h-9" {...register(`items.${index}.unitPrice`)} />
                    </div>
                    <div className="col-span-1 min-w-0">
                      <Input type="number" min="0" step="0.01" className="h-9 text-center" {...register(`items.${index}.discount`)} />
                    </div>
                    <div className="col-span-1 min-w-0">
                      <Input type="number" min="0" step="0.01" className="h-9 text-center" {...register(`items.${index}.tax`)} />
                    </div>
                    <div className="col-span-1 min-w-0 font-medium text-right text-sm text-slate-800 pr-1 truncate" title={total.toFixed(2)}>
                      {total.toFixed(2)}
                    </div>
                    <div className="col-span-1 min-w-0 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? "Saving..." : "Save Order"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
