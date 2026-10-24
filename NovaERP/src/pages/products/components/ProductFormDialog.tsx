import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { useFormValidation } from "@/hooks/use-form-validation";
import { ValidationSummary } from "@/components/ui/ValidationSummary";

import { ProductDto, CreateProductDto, UpdateProductDto, ProductType } from "@/types/products.types";
import { BrandDto } from "@/types/brands.types";
import { CategoryDto } from "@/types/categories.types";
import { UnitDto } from "@/types/units.types";
import { ImageUpload } from "@/components/ui/ImageUpload";

import { brandsApi } from "@/api/brands.api";
import { categoriesApi } from "@/api/categories.api";
import { unitsApi } from "@/api/units.api";
import { productsApi } from "@/api/products.api";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  productType: z.coerce.number().min(1, "Product Type is required"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().min(1, "Brand is required"),
  unitId: z.string().min(1, "Unit is required"),
  costPrice: z.coerce.number().min(0, "Cost Price must be 0 or greater"),
  sellingPrice: z.coerce.number().min(0, "Selling Price must be 0 or greater"),
  minimumStock: z.coerce.number().min(0, "Minimum stock must be 0 or greater"),
  maximumStock: z.coerce.number().min(0, "Maximum stock must be 0 or greater"),
  reorderLevel: z.coerce.number().min(0, "Reorder level must be 0 or greater"),
  imageUrl: z.string().optional(),
  specifications: z.array(z.object({
    id: z.string().optional(),
    attributeName: z.string().trim().min(1, "Attribute name is required"),
    value: z.string().trim().min(1, "Value is required"),
    displayOrder: z.number().default(0)
  })).default([]),
  isActive: z.boolean(),
}).refine((data) => data.maximumStock >= data.minimumStock, {
  message: "Maximum stock level must be greater than or equal to minimum stock level",
  path: ["maximumStock"],
}).refine((data) => data.reorderLevel >= data.minimumStock, {
  message: "Reorder level must be greater than or equal to minimum stock level",
  path: ["reorderLevel"],
}).refine((data) => data.maximumStock >= data.reorderLevel, {
  message: "Maximum stock level must be greater than or equal to reorder level",
  path: ["maximumStock"],
}).refine((data) => data.sellingPrice >= data.costPrice, {
  message: "Selling price must be greater than or equal to cost price",
  path: ["sellingPrice"],
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductDto;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => Promise<void>;
}

export function ProductFormDialog({
  isOpen,
  onClose,
  product,
  onSubmit,
}: ProductFormDialogProps) {
  const isEditing = !!product;
  
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      productType: ProductType.FinishedGood,
      categoryId: "",
      brandId: "",
      unitId: "",
      costPrice: 0,
      sellingPrice: 0,
      minimumStock: 0,
      maximumStock: 0,
      reorderLevel: 0,
      imageUrl: "",
      specifications: [],
      isActive: true,
    },
  });

  const { globalErrors, withValidation, isSubmitting } = useFormValidation({ form });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "specifications"
  });
  
  const watchProductType = form.watch("productType");

  useEffect(() => {
    if (isOpen) {
      if (product) {
        form.reset({
          name: product.name,
          description: product.description || "",
          productType: product.productType,
          categoryId: product.categoryId,
          brandId: product.brandId,
          unitId: product.unitId,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          minimumStock: product.minimumStock,
          maximumStock: product.maximumStock,
          reorderLevel: product.reorderLevel,
          imageUrl: product.imageUrl || "",
          specifications: product.specifications || [],
          isActive: product.isActive,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          productType: ProductType.FinishedGood,
          categoryId: "",
          brandId: "",
          unitId: "",
          costPrice: 0,
          sellingPrice: 0,
          minimumStock: 0,
          maximumStock: 0,
          reorderLevel: 0,
          imageUrl: "",
          specifications: [],
          isActive: true,
        });
      }
      setImageFile(null);
      fetchDropdowns();
    }
  }, [isOpen, product, form]);

  // Set default Brand to Nova Electronics if it's a Finished Good and Brands are loaded
  useEffect(() => {
    if (!isEditing && brands.length > 0 && watchProductType === ProductType.FinishedGood) {
      const novaBrand = brands.find(b => b.name === "Nova Electronics");
      if (novaBrand && form.getValues("brandId") !== novaBrand.id) {
        form.setValue("brandId", novaBrand.id, { shouldValidate: true });
      }
    }
  }, [watchProductType, brands, isEditing, form]);

  const fetchDropdowns = async () => {
    try {
      setIsLoadingDropdowns(true);
      const [brandsRes, categoriesRes, unitsRes] = await Promise.all([
        brandsApi.getAll({ pageNumber: 1, pageSize: 100 }),
        categoriesApi.getAll({ pageNumber: 1, pageSize: 100 }),
        unitsApi.getAll({ pageNumber: 1, pageSize: 100 })
      ]);
      setBrands(brandsRes.items);
      setCategories(categoriesRes.items);
      setUnits(unitsRes.items);
    } catch (error) {
      console.error("Failed to load dropdowns", error);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const handleSubmit = withValidation(async (data) => {
    if (imageFile) {
      const uploadRes = await productsApi.uploadImage(imageFile);
      data.imageUrl = uploadRes.url;
    }
    
    await onSubmit(data as any);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Product" : "Add Product"}
      description={isEditing ? "Update the product details below." : "Enter the details for the new product."}
      size="2xl"
    >
      {isLoadingDropdowns ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8" noValidate>
            <ValidationSummary errors={globalErrors} />
            
            {/* General Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">General Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type *</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v)} value={field.value.toString()} disabled={isEditing}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ProductType.FinishedGood.toString()}>Finished Good (Manufactured)</SelectItem>
                          <SelectItem value={ProductType.Component.toString()}>Component (Raw Material)</SelectItem>
                        </SelectContent>
                      </Select>
                      {isEditing && (
                        <FormDescription>Changing product type validates existing BOM/Order dependencies.</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Wireless Headphones" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => {
                    const isDisabled = watchProductType === ProductType.FinishedGood;
                    return (
                      <FormItem>
                        <FormLabel>Brand *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value} 
                          disabled={isDisabled}
                        >
                          <FormControl>
                            <SelectTrigger className={isDisabled ? 'bg-slate-50' : ''}>
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands.map(b => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isDisabled && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            Finished Goods must use Nova Electronics.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="unitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measure *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {units.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed description of the product..." className="resize-none" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* System Identifiers (Read-only view during edit) */}
            {isEditing && (
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold text-slate-900">System Identifiers</h3>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Auto-Generated</span>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Product Number</label>
                    <Input value={product?.productNumber || ""} disabled className="h-8 text-sm font-mono bg-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Product Code</label>
                    <Input value={product?.productCode || ""} disabled className="h-8 text-sm font-mono bg-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">SKU</label>
                    <Input value={product?.sku || ""} disabled className="h-8 text-sm font-mono bg-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Barcode</label>
                    <Input value={product?.barcode || "N/A"} disabled className="h-8 text-sm font-mono bg-slate-100" />
                  </div>
                </div>
              </div>
            )}

            {/* Pricing & Inventory */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Pricing & Inventory</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Price *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="minimumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Stock *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reorderLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reorder Level *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maximumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Stock *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Specifications & Media */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Specifications & Media</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Specifications</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => append({ attributeName: "", value: "", displayOrder: fields.length })}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  
                  {fields.length === 0 ? (
                    <div className="text-sm text-slate-500 italic py-4 text-center border rounded-md border-dashed">
                      No specifications added yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <FormField
                            control={form.control}
                            name={`specifications.${index}.attributeName`}
                            render={({ field }) => (
                              <FormItem className="flex-1 space-y-1">
                                {index === 0 && <FormLabel className="text-xs">Attribute</FormLabel>}
                                <FormControl>
                                  <Input placeholder="e.g. Color" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`specifications.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1 space-y-1">
                                {index === 0 && <FormLabel className="text-xs">Value</FormLabel>}
                                <FormControl>
                                  <Input placeholder="e.g. Red" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className={index === 0 ? "mt-6 text-red-500" : "text-red-500"} 
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <FormLabel>Product Image</FormLabel>
                  <ImageUpload
                    value={form.watch("imageUrl") || undefined}
                    onChange={(file) => {
                      if (file) {
                        setImageFile(file);
                      } else {
                        setImageFile(null);
                        form.setValue("imageUrl", "");
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-slate-200 bg-white p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-slate-500">
                        Inactive products will be hidden from new orders and BOMs.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Product" : "Save Product")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </Modal>
  );
}
