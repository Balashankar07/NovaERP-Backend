import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, ChevronDown, Search } from "lucide-react";
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
  const [sameAsBilling, setSameAsBilling] = useState(false);
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
        const isSame = 
          !!orderToEdit.billingAddress && 
          orderToEdit.billingAddress === orderToEdit.shippingAddress;
        setSameAsBilling(isSame);

        reset({
          distributorId: orderToEdit.distributorId,
          requiredDeliveryDate: orderToEdit.requiredDeliveryDate?.substring(0, 10) || "",
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
        setSameAsBilling(false);
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

  const handleCustomerChange = (val: string) => {
    setValue("distributorId", val);
    const selectedDist = distributors.find(d => d.id === val);
    if (selectedDist && selectedDist.address) {
      // Auto-populate addresses from distributor master record
      if (!watch("billingAddress") || watch("billingAddress") === "") {
        setValue("billingAddress", selectedDist.address);
      }
      if (sameAsBilling || !watch("shippingAddress") || watch("shippingAddress") === "") {
        setValue("shippingAddress", selectedDist.address);
      }
    }
  };

  const handleBillingAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setValue("billingAddress", val);
    if (sameAsBilling) {
      setValue("shippingAddress", val);
    }
  };

  const handleSameAsBillingToggle = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked) {
      setValue("shippingAddress", watch("billingAddress"));
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

      if (isEditing && orderToEdit) {
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Top Form Grid: Symmetrical & Balanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Row 1: Customer & Delivery Date */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold text-slate-700">Customer (Distributor) *</Label>
              <SearchableSelect
                value={watch("distributorId")}
                onValueChange={handleCustomerChange}
                placeholder="Select Customer"
                searchPlaceholder="Search customers/distributors..."
                options={distributors.map((d) => ({
                  value: d.id,
                  label: `${d.companyName} (${d.contactPerson})`
                }))}
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold text-slate-700">Required Delivery Date</Label>
              <Input 
                type="date" 
                min={new Date().toISOString().split("T")[0]}
                {...register("requiredDeliveryDate", {
                  validate: (val) => !val || new Date(val) >= new Date(new Date().setHours(0,0,0,0)) || "Required delivery date cannot be in the past"
                })} 
              />
              {errors.requiredDeliveryDate && <p className="text-xs text-rose-500 font-medium">{errors.requiredDeliveryDate.message}</p>}
            </div>

            {/* Row 2: Currency & Remarks */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold text-slate-700">Currency</Label>
              <Input {...register("currency")} placeholder="USD" defaultValue="USD" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold text-slate-700">Remarks / Specific Instructions</Label>
              <Input {...register("remarks")} placeholder="e.g., Deliver to Gate 3, expedite shipping..." />
            </div>

            {/* Row 3: Addresses Side-by-Side (Balanced Layout) */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <Label htmlFor="billingAddress" className="text-xs font-semibold text-slate-700">
                  Billing Address (Invoice / Accounts Payable)
                </Label>
              </div>
              <Textarea 
                id="billingAddress"
                rows={2} 
                className="min-h-[58px] resize-none" 
                {...register("billingAddress")} 
                onChange={handleBillingAddressChange}
                placeholder="Corporate headquarters or invoicing address..." 
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <Label htmlFor="shippingAddress" className="text-xs font-semibold text-slate-700">
                  Shipping Address (Logistics Receiving Dock)
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
                className={`min-h-[58px] resize-none ${sameAsBilling ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`} 
                {...register("shippingAddress")} 
                placeholder="Physical warehouse dock address for delivery..." 
                disabled={sameAsBilling}
              />
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

                return (
                  <div key={field.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-slate-50/50 transition-colors">
                    <div className="col-span-4 min-w-0">
                      <SearchableSelect
                        value={watch(`items.${index}.productId`)}
                        onValueChange={(val) => {
                          setValue(`items.${index}.productId`, val);
                          const prod = products.find(p => p.id === val);
                          if (prod) {
                            setValue(`items.${index}.unitPrice`, prod.sellingPrice || prod.price || 0);
                          }
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

          {/* Financial Summary Card (Professional Grand Total) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
            <div className="text-xs text-slate-500 max-w-sm space-y-1">
              <p>• Commercial prices reflect agreed distributor tier.</p>
              <p>• Inventory reservation occurs automatically upon order approval.</p>
            </div>
            
            <div className="w-full sm:w-80 bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 space-y-2 text-sm shadow-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({watchedItems.length} line item{watchedItems.length === 1 ? "" : "s"}):</span>
                <span className="font-semibold text-slate-900">
                  {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount:</span>
                  <span className="font-semibold">
                    -{currency} {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {totalTax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Total Tax / Duties:</span>
                  <span className="font-semibold text-slate-900">
                    +{currency} {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Grand Total:</span>
                <span className="text-lg font-bold text-indigo-600">
                  {currency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5"
            >
              {loading ? "Saving Order..." : isEditing ? "Update Order" : "Save Order"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
