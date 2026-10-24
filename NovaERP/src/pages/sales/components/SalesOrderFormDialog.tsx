import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, ChevronDown, Search } from "lucide-react";
import { salesApi } from "@/api/sales.api";
import { CreateSalesOrderDto, UpdateSalesOrderDto, SalesOrderDto } from "@/types/sales.types";
import { distributorsApi } from "@/api/distributors.api";
import { productsApi } from "@/api/products.api";
import { ProductType } from "@/types/products.types";
import { cn } from "@/lib/utils";

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

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  searchPlaceholder: string;
  error?: boolean;
}

function SearchableSelect({ value, onValueChange, options, placeholder, searchPlaceholder, error }: SearchableSelectProps) {
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
          className={cn(
            "w-full justify-between font-normal hover:bg-transparent min-w-0 overflow-hidden text-left h-9 text-xs",
            error ? "border-rose-500 ring-1 ring-rose-500 text-rose-900 bg-rose-50/20" : ""
          )}
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

const getDefaultDeliveryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
};

const parseDateForInput = (d?: string | Date | null) => {
  if (!d) return getDefaultDeliveryDate();
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return getDefaultDeliveryDate();
    return parsed.toISOString().split("T")[0];
  } catch {
    return getDefaultDeliveryDate();
  }
};

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
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const isEditing = !!orderToEdit;

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateSalesOrderDto>({
    defaultValues: {
      distributorId: "",
      requiredDeliveryDate: getDefaultDeliveryDate(),
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
        const isSame = 
          !!orderToEdit.billingAddress && 
          orderToEdit.billingAddress === orderToEdit.shippingAddress;
        setSameAsBilling(isSame);

        reset({
          distributorId: orderToEdit.distributorId,
          requiredDeliveryDate: parseDateForInput(orderToEdit.requiredDeliveryDate),
          currency: orderToEdit.currency || "USD",
          shippingAddress: orderToEdit.shippingAddress || "",
          billingAddress: orderToEdit.billingAddress || "",
          remarks: orderToEdit.remarks || "",
          items: orderToEdit.items && orderToEdit.items.length > 0
            ? orderToEdit.items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                unit: i.unit || "ea",
                discount: i.discount || 0,
                tax: i.tax || 0,
              }))
            : [{ productId: "", quantity: 1, unitPrice: 0, unit: "ea", discount: 0, tax: 0 }],
        });
      } else {
        setSameAsBilling(false);
        reset({
          distributorId: "",
          requiredDeliveryDate: getDefaultDeliveryDate(),
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
      setProducts(
        prodResult?.items?.filter(
          (p: any) =>
            p.productType === ProductType.FinishedGood ||
            p.productType === 1 ||
            p.productType === "FinishedGood"
        ) || []
      );
    } catch {
      // Handled silently
    }
  };

  const setDatePreset = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const dateStr = d.toISOString().split("T")[0];
    setValue("requiredDeliveryDate", dateStr, { shouldValidate: true });
  };

  const handleCustomerChange = (val: string) => {
    setValue("distributorId", val, { shouldValidate: true });
    const selectedDist = distributors.find(d => d.id === val);
    if (selectedDist && selectedDist.address) {
      if (!watch("billingAddress") || watch("billingAddress") === "") {
        setValue("billingAddress", selectedDist.address, { shouldValidate: true });
      }
      if (sameAsBilling || !watch("shippingAddress") || watch("shippingAddress") === "") {
        setValue("shippingAddress", selectedDist.address, { shouldValidate: true });
      }
    }
  };

  const handleBillingAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setValue("billingAddress", val, { shouldValidate: true });
    if (sameAsBilling) {
      setValue("shippingAddress", val, { shouldValidate: true });
    }
  };

  const handleSameAsBillingToggle = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked) {
      setValue("shippingAddress", watch("billingAddress") || "", { shouldValidate: true });
    }
  };

  const watchedItems = watch("items") || [];
  const currency = watch("currency") || "USD";

  const subtotal = watchedItems.reduce(
    (acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0
  );
  const totalDiscount = watchedItems.reduce(
    (acc, i) => acc + (Number(i.discount) || 0),
    0
  );
  const totalTax = watchedItems.reduce(
    (acc, i) => acc + (Number(i.tax) || 0),
    0
  );
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);

  const onSubmit = async (data: CreateSalesOrderDto) => {
    setApiError(null);

    if (!data.distributorId) {
      setApiError("Please select a Customer (Distributor).");
      return;
    }
    if (!data.requiredDeliveryDate) {
      setApiError("Please select a Required Delivery Date.");
      return;
    }
    if (!data.billingAddress || data.billingAddress.trim().length < 5) {
      setApiError("Please provide a valid Billing Address (at least 5 characters).");
      return;
    }
    if (!data.shippingAddress || data.shippingAddress.trim().length < 5) {
      setApiError("Please provide a valid Shipping Address (at least 5 characters).");
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
      const payload = {
        ...data,
        currency: "USD",
        requiredDeliveryDate: new Date(data.requiredDeliveryDate).toISOString(),
        items: data.items.map(i => ({
          ...i,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discount: Number(i.discount || 0),
          tax: Number(i.tax || 0),
        }))
      };

      if (isEditing && orderToEdit) {
        await salesApi.updateSalesOrder(orderToEdit.id, payload as UpdateSalesOrderDto);
      } else {
        await salesApi.createSalesOrder(payload);
      }
      onSuccess();
    } catch (err: any) {
      setApiError(err.message || "Failed to save sales order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)} 
      title={isEditing ? "Edit Sales Order" : "New Sales Order"} 
      size="5xl"
    >
      <div className="max-h-[75vh] overflow-y-auto pr-2">
        {apiError && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {apiError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Top Form Grid: Streamlined, Balanced & Compact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Row 1: Customer & Delivery Date */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold text-slate-700">Customer (Distributor) *</Label>
              <SearchableSelect
                value={watch("distributorId")}
                onValueChange={handleCustomerChange}
                error={!!errors.distributorId}
                placeholder="Select Customer *"
                searchPlaceholder="Search customers/distributors..."
                options={distributors.map((d) => ({
                  value: d.id,
                  label: `${d.companyName} (${d.contactPerson})`
                }))}
              />
              <input type="hidden" {...register("distributorId", { required: "Customer (Distributor) is required" })} />
              {errors.distributorId && (
                <p className="text-xs text-rose-500 font-medium">{errors.distributorId.message}</p>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">Required Delivery Date *</Label>
              </div>
              <Input 
                type="date" 
                className={cn(
                  "h-9 text-xs",
                  errors.requiredDeliveryDate ? "border-rose-500 focus-visible:ring-rose-500" : ""
                )}
                {...register("requiredDeliveryDate", {
                  required: "Required delivery date is mandatory",
                  validate: (val) => {
                    if (!val) return "Required delivery date is mandatory";
                    const dateVal = new Date(val);
                    if (isNaN(dateVal.getTime())) return "Invalid date";
                    if (!isEditing) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (dateVal < today) return "Required delivery date cannot be in the past";
                    }
                    return true;
                  }
                })} 
              />
              {errors.requiredDeliveryDate && (
                <p className="text-xs text-rose-500 font-medium">{errors.requiredDeliveryDate.message}</p>
              )}
              {/* Quick Lead Time Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">Quick Lead Time:</span>
                <button
                  type="button"
                  onClick={() => setDatePreset(3)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors border border-slate-200"
                >
                  +3d (Rush)
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(7)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors border border-slate-200"
                >
                  +7d (Std)
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(14)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors border border-slate-200"
                >
                  +14d (Bulk)
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(30)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors border border-slate-200"
                >
                  +30d (Sched)
                </button>
              </div>
            </div>

            {/* Row 2: Addresses Side-by-Side (Auto-populated & Same-as-Billing) */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <Label htmlFor="billingAddress" className="text-xs font-semibold text-slate-700">
                  Billing Address (Invoice / Accounts Payable) *
                </Label>
              </div>
              <Textarea 
                id="billingAddress"
                rows={2} 
                className={cn(
                  "min-h-[50px] resize-none text-xs",
                  errors.billingAddress ? "border-rose-500 focus-visible:ring-rose-500" : ""
                )} 
                {...register("billingAddress", {
                  required: "Billing address is required for invoicing",
                  minLength: { value: 5, message: "Billing address must be at least 5 characters" }
                })} 
                onChange={handleBillingAddressChange}
                placeholder="Corporate headquarters or invoicing address..." 
              />
              {errors.billingAddress && (
                <p className="text-xs text-rose-500 font-medium">{errors.billingAddress.message}</p>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <Label htmlFor="shippingAddress" className="text-xs font-semibold text-slate-700">
                  Shipping Address (Logistics Receiving Dock) *
                </Label>
                <label className="flex items-center space-x-1.5 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => handleSameAsBillingToggle(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span>Same as Billing</span>
                </label>
              </div>
              <Textarea 
                id="shippingAddress"
                rows={2} 
                className={cn(
                  "min-h-[50px] resize-none text-xs",
                  sameAsBilling ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "",
                  errors.shippingAddress ? "border-rose-500 focus-visible:ring-rose-500" : ""
                )} 
                {...register("shippingAddress", {
                  required: "Shipping address is required for logistics delivery",
                  minLength: { value: 5, message: "Shipping address must be at least 5 characters" }
                })} 
                placeholder="Physical warehouse dock address for delivery..." 
                disabled={sameAsBilling}
              />
              {errors.shippingAddress && (
                <p className="text-xs text-rose-500 font-medium">{errors.shippingAddress.message}</p>
              )}
            </div>

            {/* Row 3: Remarks / Specific Instructions (Full Width) */}
            <div className="col-span-1 md:col-span-2 space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold text-slate-700">Remarks / Order Instructions</Label>
              <Input 
                {...register("remarks")} 
                placeholder="e.g., Deliver to Gate 3, expedite shipping, customer PO reference..." 
                className="h-9 text-xs"
              />
              <input type="hidden" {...register("currency")} defaultValue="USD" />
            </div>
          </div>

          {/* Order Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Order Items</h3>
                <p className="text-xs text-slate-500">Add finished goods to be manufactured or fulfilled.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: "", quantity: 1, unitPrice: 0, unit: "ea", discount: 0, tax: 0 })}
                className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Item
              </Button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm bg-white">
              <div className="grid grid-cols-12 gap-2 px-3 py-2.5 bg-slate-50/90 font-semibold text-xs text-slate-600 uppercase tracking-wider">
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
                const total = Math.max(0, (qty * price) - discount + tax);

                const itemErrors = errors.items?.[index];

                return (
                  <div key={field.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-slate-50/50 transition-colors">
                    <div className="col-span-4 min-w-0">
                      <SearchableSelect
                        value={watch(`items.${index}.productId`)}
                        onValueChange={(val) => {
                          setValue(`items.${index}.productId`, val, { shouldValidate: true });
                          const prod = products.find(p => p.id === val);
                          if (prod) {
                            setValue(`items.${index}.unitPrice`, prod.sellingPrice || prod.price || 0, { shouldValidate: true });
                          }
                        }}
                        error={!!itemErrors?.productId}
                        placeholder="Select Product *"
                        searchPlaceholder="Search finished goods..."
                        options={products.map((p) => ({
                          value: p.id,
                          label: `${p.name} (${p.sku})`
                        }))}
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.productId` as const, {
                          required: "Product is required"
                        })}
                      />
                      {itemErrors?.productId && (
                        <p className="text-[10px] text-rose-500 font-medium mt-0.5 truncate">
                          {itemErrors.productId.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 min-w-0">
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="1" 
                        className={cn(
                          "h-9 text-xs",
                          itemErrors?.quantity ? "border-rose-500 focus-visible:ring-rose-500" : ""
                        )} 
                        {...register(`items.${index}.quantity` as const, {
                          required: "Qty > 0",
                          validate: (v) => Number(v) > 0 || "Must be > 0"
                        })} 
                      />
                      {itemErrors?.quantity && (
                        <p className="text-[10px] text-rose-500 font-medium mt-0.5 truncate">
                          {itemErrors.quantity.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 min-w-0">
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        className={cn(
                          "h-9 text-xs",
                          itemErrors?.unitPrice ? "border-rose-500 focus-visible:ring-rose-500" : ""
                        )} 
                        {...register(`items.${index}.unitPrice` as const, {
                          required: "Price >= 0",
                          validate: (v) => Number(v) >= 0 || "Min 0"
                        })} 
                      />
                      {itemErrors?.unitPrice && (
                        <p className="text-[10px] text-rose-500 font-medium mt-0.5 truncate">
                          {itemErrors.unitPrice.message}
                        </p>
                      )}
                    </div>
                    <div className="col-span-1 min-w-0">
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        className="h-9 text-center text-xs" 
                        {...register(`items.${index}.discount` as const, {
                          min: { value: 0, message: "Min 0" }
                        })} 
                      />
                    </div>
                    <div className="col-span-1 min-w-0">
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        className="h-9 text-center text-xs" 
                        {...register(`items.${index}.tax` as const, {
                          min: { value: 0, message: "Min 0" }
                        })} 
                      />
                    </div>
                    <div className="col-span-1 min-w-0 font-medium text-right text-xs text-slate-800 pr-1 truncate" title={total.toFixed(2)}>
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

          {/* Financial Summary Card (Professional Grand Total) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pt-2">
            <div className="text-xs text-slate-500 max-w-sm space-y-1">
              <p>• Commercial prices reflect agreed distributor tier.</p>
              <p>• Inventory reservation occurs automatically upon order approval.</p>
            </div>
            
            <div className="w-full sm:w-80 bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 space-y-1.5 text-xs shadow-sm">
              <div className="flex justify-between items-center text-slate-500 pb-1 border-b border-slate-200/60">
                <span>Pricing Currency:</span>
                <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-800 text-[11px]">
                  {currency || "USD"} ($)
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({watchedItems.length} item{watchedItems.length === 1 ? "" : "s"}):</span>
                <span className="font-semibold text-slate-900">
                  {currency || "USD"} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Total Discount:</span>
                  <span>
                    -{currency || "USD"} {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Total Tax / Duties:</span>
                  <span className="text-slate-900">
                    +{currency || "USD"} {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="pt-1.5 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Grand Total:</span>
                <span className="text-base font-bold text-indigo-600">
                  {currency || "USD"} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Modal Action Buttons (Always Visible) */}
          <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-white/95 backdrop-blur border-t border-slate-200 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 text-xs h-9 shadow-sm min-w-[130px]"
            >
              {loading ? "Saving Order..." : isEditing ? "Update Order" : "Save Order"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
