import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { purchaseOrdersApi } from "@/api/purchaseOrders.api";
import { productsApi } from "@/api/products.api";
import { suppliersApi } from "@/api/suppliers.api";
import { supplierProductsApi } from "@/api/supplierProducts.api";
import { CreatePurchaseOrderDto, CreatePurchaseOrderItemDto } from "@/types/purchaseOrders.types";
import { SupplierDto, SupplierProductDto } from "@/types/suppliers.types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, AlertCircle, ShoppingCart, Info, Loader2, Building2, PackageCheck } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PurchaseOrderFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPrId?: string | null;
}

// Fallback demo suppliers
const DEFAULT_FALLBACK_SUPPLIERS: SupplierDto[] = [
  {
    id: "sup-fallback-1",
    supplierCode: "SUP-001",
    supplierName: "Global Tech Supplies Co.",
    companyName: "Global Tech Supplies Co.",
    contactPerson: "Sarah Jenkins",
    email: "procurement@globaltech.com",
    phone: "+1 (555) 234-5678",
    currency: "USD",
    paymentTerms: "Net 30",
    isActive: true,
  },
  {
    id: "sup-fallback-2",
    supplierCode: "SUP-002",
    supplierName: "Apex Microelectronics Inc.",
    companyName: "Apex Microelectronics Inc.",
    contactPerson: "David Miller",
    email: "orders@apexmicro.com",
    phone: "+1 (555) 876-5432",
    currency: "USD",
    paymentTerms: "Net 15",
    isActive: true,
  },
  {
    id: "sup-fallback-3",
    supplierCode: "SUP-003",
    supplierName: "Quantum Semiconductor Corp",
    companyName: "Quantum Semiconductor Corp",
    contactPerson: "Elena Rostova",
    email: "sales@quantumsemi.io",
    phone: "+1 (555) 432-1098",
    currency: "EUR",
    paymentTerms: "Net 60",
    isActive: true,
  }
];

// Full catalog of 10 manufacturing components
const ALL_DEMO_COMPONENTS: SupplierProductDto[] = [
  {
    id: "comp-fb-1",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-1",
    productName: "Microcontroller Board ARM Cortex-M4",
    supplierSKU: "MCU-ARM-M4-01",
    unitPrice: 18.50,
    currency: "USD",
    moq: 10,
    leadTimeDays: 5,
    isPreferred: true,
    isActive: true,
  },
  {
    id: "comp-fb-2",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-2",
    productName: "Silicon Wafer Substrate 300mm",
    supplierSKU: "SIL-WAF-300MM",
    unitPrice: 145.00,
    currency: "USD",
    moq: 25,
    leadTimeDays: 14,
    isPreferred: true,
    isActive: true,
  },
  {
    id: "comp-fb-3",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-3",
    productName: "High Capacity Li-Ion Battery Module 5000mAh",
    supplierSKU: "BAT-MOD-5K",
    unitPrice: 12.75,
    currency: "USD",
    moq: 20,
    leadTimeDays: 7,
    isPreferred: true,
    isActive: true,
  },
  {
    id: "comp-fb-4",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-4",
    productName: "Precision Voltage Regulator IC 3.3V",
    supplierSKU: "VR-IC-3V3",
    unitPrice: 1.85,
    currency: "USD",
    moq: 50,
    leadTimeDays: 4,
    isPreferred: false,
    isActive: true,
  },
  {
    id: "comp-fb-5",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-5",
    productName: "Precision Resistor Array 10k Ohm",
    supplierSKU: "RES-ARR-10K",
    unitPrice: 0.65,
    currency: "USD",
    moq: 100,
    leadTimeDays: 3,
    isPreferred: true,
    isActive: true,
  },
  {
    id: "comp-fb-6",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-6",
    productName: "HD Touch OLED Display Module 0.96\"",
    supplierSKU: "DISP-OLED-096",
    unitPrice: 6.20,
    currency: "USD",
    moq: 15,
    leadTimeDays: 6,
    isPreferred: true,
    isActive: true,
  },
  {
    id: "comp-fb-7",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-7",
    productName: "Multilayer PCB Board 4-Layer FR4",
    supplierSKU: "PCB-FR4-4L",
    unitPrice: 4.10,
    currency: "USD",
    moq: 30,
    leadTimeDays: 10,
    isPreferred: false,
    isActive: true,
  },
  {
    id: "comp-fb-8",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-8",
    productName: "Digital Temp & Humidity Sensor DHT22",
    supplierSKU: "SENS-DHT22",
    unitPrice: 3.40,
    currency: "USD",
    moq: 25,
    leadTimeDays: 5,
    isPreferred: true,
    isActive: true,
  },
  {
    id: "comp-fb-9",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-9",
    productName: "Ultra-Low Noise Power Supply Module 12V 2A",
    supplierSKU: "PWR-12V2A",
    unitPrice: 9.90,
    currency: "USD",
    moq: 10,
    leadTimeDays: 8,
    isPreferred: true,
    isActive: true,
  },
  {
    id: "comp-fb-10",
    supplierId: "sup-fallback-1",
    productId: "prod-fb-10",
    productName: "Aluminum Anodized Component Enclosure",
    supplierSKU: "ENC-AL-100",
    unitPrice: 14.25,
    currency: "USD",
    moq: 12,
    leadTimeDays: 12,
    isPreferred: false,
    isActive: true,
  }
];

export function PurchaseOrderFormDialog({ isOpen, onClose, onSuccess, initialPrId }: PurchaseOrderFormDialogProps) {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for the currently selected supplier and their approved components
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [approvedComponents, setApprovedComponents] = useState<SupplierProductDto[]>([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreatePurchaseOrderDto>({
    defaultValues: {
      supplierId: "",
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: "USD",
      remarks: "",
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items") || [];
  const selectedCurrency = watch("currency") || "USD";

  // Safely extract array data from any API response structure
  const parseArrayResponse = <T,>(res: any): T[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.items)) return res.items;
    return [];
  };

  const importedPrsRef = useRef<Set<string>>(new Set());

  // Fetch all suppliers on mount
  useEffect(() => {
    if (isOpen) {
      reset();
      setSelectedSupplierId("");
      setApprovedComponents([]);
      importedPrsRef.current.clear();
      setIsLoadingSuppliers(true);
      suppliersApi.getAll({ pageNumber: 1, pageSize: 100 })
        .then(res => {
          const list = parseArrayResponse<SupplierDto>(res);
          if (list.length > 0) {
            setSuppliers(list);
          } else {
            setSuppliers([]);
          }
        })
        .catch((err) => {
          console.error("Failed to load suppliers:", err);
          setSuppliers([]);
        })
        .finally(() => setIsLoadingSuppliers(false));
    }
  }, [isOpen, reset]);

  // Fetch approved components when supplier changes and merge with full 10-component catalog
  useEffect(() => {
    if (selectedSupplierId) {
      setIsLoadingComponents(true);
      Promise.all([
        supplierProductsApi.getBySupplierId(selectedSupplierId).catch(() => ({ data: [] })),
        productsApi.getAll({ pageSize: 100, productType: "Component" }).catch(() => ({ data: { items: [] } }))
      ])
        .then(([supplierProductsRes, allProductsRes]) => {
          const list = parseArrayResponse<SupplierProductDto>(supplierProductsRes as any);
          const activeList = list.filter(c => c.isActive !== false);

          // Merge with real global products (to give the user a full list of valid components)
          const globalProducts = (allProductsRes as any).data?.items || (allProductsRes as any).items || [];
          const mergedList = [...activeList];

          globalProducts.forEach((prod: any) => {
            if (!mergedList.some(item => item.productId === prod.id)) {
              mergedList.push({
                id: prod.id, // using product ID as surrogate key
                supplierId: selectedSupplierId,
                productId: prod.id,
                productName: prod.name,
                supplierSKU: prod.sku || prod.productCode,
                unitPrice: prod.costPrice || 0,
                currency: "USD",
                moq: prod.minimumStock || 1,
                leadTimeDays: 7,
                isPreferred: false,
                isActive: true
              });
            }
          });

          setApprovedComponents(mergedList);
        })
        .catch((err) => {
          console.error("Failed to load components:", err);
          setApprovedComponents([]);
        })
        .finally(() => setIsLoadingComponents(false));
    } else {
      setApprovedComponents([]);
    }
  }, [selectedSupplierId]);

  const handleSupplierChange = (val: string) => {
    if (!val) return;
    if (watchItems.length > 0) {
      if (!confirm("Changing the supplier will remove all current line items. Continue?")) {
        return;
      }
      setValue("items", []);
    }
    setSelectedSupplierId(val);
    setValue("supplierId", val);
    
    const supplier = suppliers.find(s => s.id === val || s.supplierCode === val);
    if (supplier) {
      setValue("currency", supplier.currency || "USD");
    }
  };

  const handleAddComponent = (supplierProductId: string) => {
    if (!supplierProductId) return;
    const component = approvedComponents.find(c => c.id === supplierProductId);
    if (!component) return;

    if (watchItems.some(item => item.productId === component.productId)) {
      toast.error("This component is already in the order.");
      return;
    }

    append({
      productId: component.productId,
      quantity: component.moq || 1,
      unitPrice: component.unitPrice || 0,
      discount: 0,
      tax: 0,
      remarks: ""
    });
  };

  // Load from PR if initialPrId is provided
  useEffect(() => {
    const prKey = `${initialPrId}-${selectedSupplierId}`;
    if (initialPrId && isOpen && selectedSupplierId && approvedComponents.length > 0 && !importedPrsRef.current.has(prKey)) {
      import("@/api/purchaseRequests.api").then(({ purchaseRequestsApi }) => {
        purchaseRequestsApi.getById(initialPrId).then(pr => {
          if (!pr || !pr.items) return;
          importedPrsRef.current.add(prKey);

          const prItemsToImport = pr.items.filter(item => (item.remainingQuantity ?? item.quantity) > 0);
          if (prItemsToImport.length === 0) return;

          const newFields: CreatePurchaseOrderItemDto[] = [];
          let importedCount = 0;

          prItemsToImport.forEach(prItem => {
            const comp = approvedComponents.find(c => 
              c.productId === prItem.productId || 
              (c.productName && prItem.productName && c.productName.toLowerCase() === prItem.productName.toLowerCase())
            );

            const targetProductId = comp ? comp.productId : (prItem.productId || `prod-pr-${prItem.id}`);
            const targetUnitPrice = comp ? comp.unitPrice : ((prItem as any).estimatedUnitPrice || 10.00);
            const targetMoq = comp ? comp.moq : 1;
            const targetQty = Math.max((prItem.remainingQuantity ?? prItem.quantity), targetMoq);

            const currentItems = watch("items") || [];
            if (!currentItems.some(existing => existing.productId === targetProductId)) {
              newFields.push({
                productId: targetProductId,
                purchaseRequestItemId: prItem.id,
                quantity: targetQty,
                unitPrice: targetUnitPrice,
                discount: 0,
                tax: 0,
                remarks: prItem.remarks || ""
              });
              importedCount++;
            }
          });

          if (importedCount > 0) {
            append(newFields);
            toast.success(`Imported ${importedCount} items from Purchase Request`);
          }
        }).catch((err) => {
          console.error("Failed to load Purchase Request:", err);
        });
      });
    }
  }, [initialPrId, isOpen, approvedComponents, selectedSupplierId]);

  const onSubmit = async (data: CreatePurchaseOrderDto) => {
    if (data.items.length === 0) {
      toast.error("Add at least one item to the purchase order.");
      return;
    }

    let maxLeadTimeDays = 0;
    let bottleneckComponent = "";

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const comp = approvedComponents.find(c => c.productId === item.productId);
      if (comp) {
        if (item.quantity < comp.moq) {
          toast.error(`Quantity for ${comp.productName || 'component'} must be at least ${comp.moq} (MOQ).`);
          return;
        }
        if (comp.leadTimeDays > maxLeadTimeDays) {
          maxLeadTimeDays = comp.leadTimeDays;
          bottleneckComponent = comp.productName || 'component';
        }
      }
    }

    const expectedDate = new Date(data.expectedDeliveryDate);
    const minDeliveryDate = new Date();
    minDeliveryDate.setHours(0,0,0,0);
    minDeliveryDate.setDate(minDeliveryDate.getDate() + maxLeadTimeDays);

    if (expectedDate < minDeliveryDate) {
      toast.error(`Expected delivery date cannot be earlier than ${minDeliveryDate.toLocaleDateString()}. Component '${bottleneckComponent}' requires ${maxLeadTimeDays} days lead time.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await purchaseOrdersApi.create(data);
      toast.success("Purchase order created successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate order total sum
  const orderSubtotal = watchItems.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return acc + (qty * price);
  }, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      description="Create a new procurement order linked to approved supplier items."
      size="5xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Header Configuration Card */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {/* Supplier Selector */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                Supplier <span className="text-rose-500">*</span>
              </Label>
              <Select value={selectedSupplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 text-sm">
                  <SelectValue placeholder={isLoadingSuppliers ? "Loading suppliers..." : "Select Supplier..."} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSuppliers ? (
                    <div className="p-3 text-xs text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      Loading suppliers...
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                      No active suppliers found
                    </div>
                  ) : (
                    suppliers.map(s => {
                      const name = s.companyName || s.supplierName || (s as any).name || "Unnamed Supplier";
                      const code = s.supplierCode || (s as any).code;
                      return (
                        <SelectItem key={s.id} value={s.id}>
                          {name} {code ? `(${code})` : ""}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {errors.supplierId && <p className="text-xs text-rose-500 font-medium">{errors.supplierId.message}</p>}
            </div>

            {/* Expected Delivery Date */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Expected Delivery <span className="text-rose-500">*</span>
              </Label>
              <Input 
                type="date" 
                min={new Date().toISOString().split("T")[0]}
                {...register("expectedDeliveryDate", { 
                  required: "Required",
                  validate: (val) => !val || new Date(val) >= new Date(new Date().setHours(0,0,0,0)) || "Expected delivery date cannot be in the past"
                })} 
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 text-sm dark:text-slate-100" 
              />
              {errors.expectedDeliveryDate && <p className="text-xs text-rose-500 font-medium">{errors.expectedDeliveryDate.message}</p>}
            </div>

            {/* Currency */}
            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Currency
              </Label>
              <Input 
                {...register("currency")} 
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 font-mono uppercase text-sm dark:text-slate-100" 
                placeholder="USD" 
              />
            </div>
          </div>
          
          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Remarks / PO Notes
            </Label>
            <Input 
              {...register("remarks")} 
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 text-sm dark:text-slate-100 placeholder:text-slate-400" 
              placeholder="Optional notes or terms for the supplier..." 
            />
          </div>
        </div>

        {/* Line Items Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 gap-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-500" />
              Line Items
              {fields.length > 0 && (
                <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 ml-1">
                  {fields.length} {fields.length === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </h3>
            
            {/* Component Adder Selector */}
            <div className="w-full sm:w-80">
              <Select 
                disabled={!selectedSupplierId || isLoadingComponents || approvedComponents.length === 0}
                onValueChange={(val) => handleAddComponent(val)}
                value=""
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 text-xs sm:text-sm">
                  <SelectValue placeholder={
                    !selectedSupplierId ? "Select Supplier First" : 
                    isLoadingComponents ? "Loading components..." : 
                    approvedComponents.length === 0 ? "No approved components" : 
                    "+ Add Approved Component..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingComponents ? (
                    <div className="p-3 text-xs text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      Loading components...
                    </div>
                  ) : approvedComponents.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                      No approved components found
                    </div>
                  ) : (
                    approvedComponents.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.productName} ({c.supplierSKU}) - ${c.unitPrice}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <PackageCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-700 dark:text-slate-300 font-medium">No items added to this purchase order.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Select a supplier above, then select approved components from the dropdown menu.</p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70 uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Component Details</th>
                    <th className="px-4 py-3 font-semibold w-40">Quantity</th>
                    <th className="px-4 py-3 font-semibold w-40">Unit Price</th>
                    <th className="px-4 py-3 font-semibold text-right w-32">Line Total</th>
                    <th className="px-4 py-3 font-semibold text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fields.map((field, index) => {
                    const compInfo = approvedComponents.find(c => c.productId === watchItems[index]?.productId);
                    if (!compInfo) return null;

                    const currentQty = watchItems[index]?.quantity || 0;
                    const isBelowMOQ = currentQty < compInfo.moq;
                    
                    const currentPrice = watchItems[index]?.unitPrice || 0;
                    const isPriceOverridden = currentPrice !== compInfo.unitPrice;
                    const lineTotal = currentQty * currentPrice;

                    return (
                      <tr key={field.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors align-top">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{compInfo.productName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">SKU: {compInfo.supplierSKU}</div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              Lead Time: {compInfo.leadTimeDays}d
                            </Badge>
                            {compInfo.isPreferred && (
                              <Badge variant="secondary" className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                                Preferred Supplier
                              </Badge>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            <Input 
                              type="number" 
                              step="0.01"
                              {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 0.01 })} 
                              className={`w-full h-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm font-mono dark:text-slate-100 ${isBelowMOQ ? 'border-rose-400 focus-visible:ring-rose-500 dark:border-rose-500' : ''}`}
                            />
                            <div className="flex flex-col gap-1 text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400">MOQ: {compInfo.moq}</span>
                              {isBelowMOQ && (
                                <span className="text-rose-500 dark:text-rose-400 flex items-center font-medium">
                                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" /> Below MOQ
                                </span>
                              )}
                              {watchItems[index]?.purchaseRequestItemId && (
                                <span className="text-indigo-600 dark:text-indigo-400 flex items-center font-medium bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded">
                                  <Info className="w-3 h-3 mr-1 shrink-0" /> PR Linked
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs font-mono">$</span>
                              <Input 
                                type="number" 
                                step="0.01"
                                {...register(`items.${index}.unitPrice`, { valueAsNumber: true, min: 0 })} 
                                className="w-full h-9 pl-7 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-sm dark:text-slate-100"
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400">Appr: {formatCurrency(compInfo.unitPrice, compInfo.currency)}</span>
                              {isPriceOverridden && (
                                <span className="text-amber-600 dark:text-amber-400 flex items-center font-medium bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                  <Info className="w-3 h-3 mr-1 shrink-0" /> Overridden
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 text-right">
                          <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 pt-1.5">
                            {formatCurrency(lineTotal, selectedCurrency)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg h-8 w-8 transition-colors"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Order Total Footer Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {fields.length} line {fields.length === 1 ? 'item' : 'items'} configured
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Estimated Total:</span>
                  <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(orderSubtotal, selectedCurrency)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="dark:border-slate-700 dark:text-slate-300">
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all font-medium"
            disabled={isSubmitting || fields.length === 0}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Order...
              </span>
            ) : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
