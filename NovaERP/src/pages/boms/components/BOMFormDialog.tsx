import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { useFormValidation } from "@/hooks/use-form-validation";
import { ValidationSummary } from "@/components/ui/ValidationSummary";

import { BOMDto, CreateBOMDto, UpdateBOMDto } from "@/types/boms.types";
import { ProductDto } from "@/types/products.types";
import { UnitDto } from "@/types/units.types";

import { productsApi } from "@/api/products.api";
import { unitsApi } from "@/api/units.api";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const bomItemSchema = z.object({
  id: z.string().optional(),
  rawMaterialProductId: z.string().min(1, "Component is required"),
  quantity: z.coerce.number().min(0.0001, "Quantity must be greater than zero"),
  unitId: z.string().min(1, "Unit is required"),
  wastePercentage: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
  remarks: z.string().optional(),
});

const bomSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  version: z.string().min(1, "Version is required"),
  description: z.string().optional(),
  effectiveDate: z.string().min(1, "Effective Date is required"),
  isActive: z.boolean(),
  items: z.array(bomItemSchema).min(1, "At least one BOM item is required"),
}).refine((data) => {
  if (!data.productId) return true;
  return !data.items.some(i => i.rawMaterialProductId === data.productId);
}, {
  message: "Finished good cannot be used as its own component in the BOM",
  path: ["items"],
}).refine((data) => {
  const componentIds = data.items.map(i => i.rawMaterialProductId).filter(Boolean);
  return new Set(componentIds).size === componentIds.length;
}, {
  message: "Duplicate components are not allowed in the same BOM",
  path: ["items"],
});

type BOMFormValues = z.infer<typeof bomSchema>;

interface BOMFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBOMDto | UpdateBOMDto, isStatusOnly?: boolean) => Promise<void>;
  bom?: BOMDto | null;
}

const isComponentProduct = (p: ProductDto): boolean => {
  const typeStr = String(p.productType || (p as any).type || "").toLowerCase();
  return typeStr === "component" || typeStr === "rawmaterial" || typeStr === "2";
};

const isFinishedGoodProduct = (p: ProductDto): boolean => {
  const typeStr = String(p.productType || (p as any).type || "").toLowerCase();
  return typeStr === "finishedgood" || typeStr === "1";
};

export function BOMFormDialog({ isOpen, onClose, onSubmit, bom }: BOMFormDialogProps) {
  const isEditing = !!bom;

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);

  const form = useForm<BOMFormValues>({
    resolver: zodResolver(bomSchema),
    defaultValues: {
      productId: "",
      version: "",
      description: "",
      effectiveDate: new Date().toISOString().slice(0, 16),
      isActive: true,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isOpen) {
      if (bom) {
        form.reset({
          productId: bom.productId,
          version: bom.version,
          description: bom.description || "",
          effectiveDate: bom.effectiveDate ? bom.effectiveDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
          isActive: bom.isActive,
          items: bom.items.map(i => ({
            id: i.id,
            rawMaterialProductId: i.rawMaterialProductId,
            quantity: i.quantity,
            unitId: i.unitId,
            wastePercentage: i.wastePercentage,
            remarks: i.remarks || "",
          })),
        });
      } else {
        form.reset({
          productId: "",
          version: "",
          description: "",
          effectiveDate: new Date().toISOString().slice(0, 16),
          isActive: true,
          items: [],
        });
      }
      
      fetchDropdowns();
    }
  }, [isOpen, bom, form]);

  const fetchDropdowns = async () => {
    try {
      setIsLoadingDropdowns(true);
      const [productsRes, unitsRes] = await Promise.all([
        productsApi.getAll({ pageNumber: 1, pageSize: 500 }),
        unitsApi.getAll({ pageNumber: 1, pageSize: 500 })
      ]);
      setProducts(productsRes.items || []);
      setUnits(unitsRes.items || []);
    } catch (error) {
      console.error("Failed to load dropdowns", error);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Harmonized Finished Goods options (ensures currently edited product is always included)
  const finishedGoodsOptions = useMemo(() => {
    const list = products.filter(isFinishedGoodProduct);
    if (bom?.productId && !list.some(p => p.id === bom.productId)) {
      list.unshift({
        id: bom.productId,
        name: bom.productName || "Finished Good",
        productCode: "",
        sku: "",
        productType: "FinishedGood" as any,
      } as ProductDto);
    }
    return list;
  }, [products, bom]);

  // Harmonized Component options (ensures all components and existing BOM items are included)
  const componentOptions = useMemo(() => {
    const list = products.filter(isComponentProduct);
    if (bom?.items) {
      for (const item of bom.items) {
        if (item.rawMaterialProductId && !list.some(c => c.id === item.rawMaterialProductId)) {
          list.push({
            id: item.rawMaterialProductId,
            name: item.rawMaterialProductName || "Component Product",
            productCode: "",
            sku: "",
            productType: "Component" as any,
          } as ProductDto);
        }
      }
    }
    return list;
  }, [products, bom]);

  // Harmonized Unit options (ensures all units and existing BOM item units are included)
  const unitOptions = useMemo(() => {
    const list = [...units];
    if (bom?.items) {
      for (const item of bom.items) {
        if (item.unitId && !list.some(u => u.id === item.unitId)) {
          list.push({
            id: item.unitId,
            name: item.unitName || "Unit",
            abbreviation: item.unitName || "u",
            isActive: true,
          } as UnitDto);
        }
      }
    }
    return list;
  }, [units, bom]);

  const { globalErrors, withValidation, isSubmitting } = useFormValidation({ form });

  const handleSubmit = withValidation(async (values) => {
    if (isEditing) {
      const dirtyFields = Object.keys(form.formState.dirtyFields);
      const isStatusOnly = dirtyFields.length === 1 && dirtyFields[0] === 'isActive';

      await onSubmit({
        version: values.version,
        description: values.description || null,
        effectiveDate: new Date(values.effectiveDate).toISOString(),
        isActive: values.isActive,
        items: values.items.map(i => ({
          id: i.id || undefined,
          rawMaterialProductId: i.rawMaterialProductId,
          quantity: i.quantity,
          unitId: i.unitId,
          wastePercentage: i.wastePercentage,
          remarks: i.remarks || null,
        })),
      } as UpdateBOMDto, isStatusOnly);
    } else {
      await onSubmit({
        productId: values.productId,
        version: values.version,
        description: values.description || null,
        effectiveDate: new Date(values.effectiveDate).toISOString(),
        isActive: values.isActive,
        items: values.items.map(i => ({
          rawMaterialProductId: i.rawMaterialProductId,
          quantity: i.quantity,
          unitId: i.unitId,
          wastePercentage: i.wastePercentage,
          remarks: i.remarks || null,
        })),
      } as CreateBOMDto);
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={isEditing ? "Edit Bill of Materials" : "Create Bill of Materials"}
      description={isEditing ? "Update the components of this BOM." : "Define components to manufacture a product."}
      size="4xl"
    >
      {isLoadingDropdowns ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
            <ValidationSummary errors={globalErrors} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Finished Product *
                    </FormLabel>
                    {isEditing ? (
                      <Input
                        value={
                          bom?.productName ||
                          products.find(p => p.id === field.value)?.name ||
                          field.value ||
                          "Finished Good"
                        }
                        disabled
                        className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium cursor-not-allowed h-10"
                      />
                    ) : (
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined} 
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {finishedGoodsOptions.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} {p.productCode ? `(${p.productCode})` : (p.sku ? `(${p.sku})` : "")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      BOM Version *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1.0" {...field} disabled={isSubmitting} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description..." {...field} disabled={isSubmitting} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Effective Date *
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} disabled={isSubmitting} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">BOM Components</h4>
                  <p className="text-xs text-slate-500">Raw materials and parts required to produce 1 unit of this finished product.</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ 
                    rawMaterialProductId: "", 
                    quantity: 1, 
                    unitId: unitOptions[0]?.id || "", 
                    wastePercentage: 0, 
                    remarks: "" 
                  })}
                  disabled={isSubmitting}
                  className="gap-1.5 text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Component
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 text-sm">
                  No components added. Click "Add Component" to start building the BOM.
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div 
                      key={field.id} 
                      className="grid grid-cols-12 md:grid-cols-[2.5fr_1fr_1.5fr_1fr_2fr_auto] gap-3 items-start border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 relative"
                    >
                      <div className="col-span-12 md:col-span-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.rawMaterialProductId`}
                          render={({ field: itemField }) => {
                            const selectedComp = componentOptions.find(p => p.id === itemField.value) ||
                                                 products.find(p => p.id === itemField.value);
                            const selectedCompName = selectedComp?.name ||
                                                     bom?.items?.[index]?.rawMaterialProductName ||
                                                     undefined;

                            return (
                              <FormItem>
                                <FormLabel className="text-xs text-slate-500 font-medium">Product</FormLabel>
                                <Select
                                  onValueChange={(val) => {
                                    itemField.onChange(val);
                                    const prod = products.find(p => p.id === val);
                                    if (prod?.unitId) {
                                      form.setValue(`items.${index}.unitId`, prod.unitId, { shouldValidate: true });
                                    }
                                  }}
                                  value={itemField.value || undefined}
                                  disabled={isSubmitting}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white dark:bg-slate-800 w-full text-xs h-9">
                                      <SelectValue placeholder="Select Component" className="truncate">
                                        {selectedCompName}
                                      </SelectValue>
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {componentOptions.map(p => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.name} {p.productCode ? `(${p.productCode})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3 md:col-span-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500 font-medium">Quantity</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0.0001"
                                  placeholder="Qty" 
                                  className="bg-white dark:bg-slate-800 w-full text-xs h-9" 
                                  {...itemField} 
                                  disabled={isSubmitting} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3 md:col-span-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitId`}
                          render={({ field: itemField }) => {
                            const selectedUnit = unitOptions.find(u => u.id === itemField.value);
                            const unitDisplayName = selectedUnit?.name ||
                                                    bom?.items?.[index]?.unitName ||
                                                    undefined;

                            return (
                              <FormItem>
                                <FormLabel className="text-xs text-slate-500 font-medium">Unit</FormLabel>
                                <Select 
                                  onValueChange={itemField.onChange} 
                                  value={itemField.value || undefined} 
                                  disabled={isSubmitting}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white dark:bg-slate-800 w-full text-xs h-9">
                                      <SelectValue placeholder="Select Unit" className="truncate">
                                        {unitDisplayName}
                                      </SelectValue>
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {unitOptions.map(u => (
                                      <SelectItem key={u.id} value={u.id}>
                                        {u.name} {u.abbreviation ? `(${u.abbreviation})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2 md:col-span-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.wastePercentage`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500 font-medium">Waste %</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  min="0"
                                  max="100"
                                  placeholder="Waste %" 
                                  className="bg-white dark:bg-slate-800 w-full text-xs h-9" 
                                  {...itemField} 
                                  disabled={isSubmitting} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-8 sm:col-span-4 md:col-span-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.remarks`}
                          render={({ field: itemField }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500 font-medium">Remarks</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Optional remarks" 
                                  className="bg-white dark:bg-slate-800 w-full text-xs h-9" 
                                  {...itemField} 
                                  disabled={isSubmitting} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-1 flex flex-col justify-end md:items-center">
                        <div className="space-y-1 flex flex-col items-end md:items-center w-full">
                          <label className="text-xs text-slate-400 font-medium block">Delete</label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 h-9 w-9 shrink-0" 
                            onClick={() => remove(index)}
                            disabled={isSubmitting}
                            title="Remove Component"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {form.formState.errors.items?.message && (
                <p className="text-[0.8rem] font-medium text-red-500 mt-2">{form.formState.errors.items.message}</p>
              )}
            </div>

            {isEditing && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm bg-white dark:bg-slate-900/60 mb-6">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        disabled={isSubmitting}
                        className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        Active BOM Status
                      </FormLabel>
                      <p className="text-[13px] text-slate-500">
                        Determine if this BOM is released and active for production operations.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Sticky Action Footer (Always Visible at bottom of dialog) */}
            <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-9 px-5 shadow-sm min-w-[120px]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update BOM" : "Create BOM")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </Modal>
  );
}
