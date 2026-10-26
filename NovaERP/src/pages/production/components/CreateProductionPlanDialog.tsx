import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { productionApi } from "@/api/production.api";
import { productsApi } from "@/api/products.api";
import { bomsApi } from "@/api/boms.api";
import { ProductType } from "@/types/products.types";
import { CreateProductionPlanDto } from "@/types/production.types";

const formSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  bomId: z.string().min(1, "BOM is required"),
  plannedQuantity: z.coerce.number().min(1, "Quantity must be at least 1").max(100000, "Planned quantity cannot exceed 100,000 units"),
  plannedStartDate: z.string().min(1, "Start date is required"),
  plannedEndDate: z.string().min(1, "End date is required"),
}).refine((data) => {
  if (!data.plannedStartDate || !data.plannedEndDate) return true;
  return new Date(data.plannedEndDate) >= new Date(data.plannedStartDate);
}, {
  message: "End date cannot be earlier than start date",
  path: ["plannedEndDate"],
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProductionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateProductionPlanDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateProductionPlanDialogProps) => {
  const queryClient = useQueryClient();

  // productType=1 (FinishedGood) — server-side filtered, matches ProductType.FinishedGood enum
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products-for-production"],
    queryFn: () => productsApi.getAll({ pageSize: 200, productType: ProductType.FinishedGood }),
    enabled: open,
  });

  const { data: bomsData, isLoading: isLoadingBoms } = useQuery({
    queryKey: ["boms-for-production"],
    queryFn: () => bomsApi.getAll({ pageSize: 500 }),
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      bomId: "",
      plannedQuantity: 1,
      plannedStartDate: new Date().toISOString().split("T")[0],
      plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateProductionPlanDto) => productionApi.createPlan(data),
    onSuccess: () => {
      toast.success("Production plan created successfully", { icon: <Check className="w-4 h-4 text-emerald-500" /> });
      queryClient.invalidateQueries({ queryKey: ["production-plans"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create production plan", { icon: <X className="w-4 h-4 text-red-500" /> });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate({
      productId: data.productId,
      bomId: data.bomId,
      plannedQuantity: data.plannedQuantity,
      plannedStartDate: new Date(data.plannedStartDate).toISOString(),
      plannedEndDate: new Date(data.plannedEndDate).toISOString(),
      priority: 3,
    });
  };

  // All returned products are FinishedGoods (filtered server-side by productType=1)
  // api-helper unwraps ApiResponse.data, so productsData is PaginatedResponse<ProductDto> directly
  const finishedGoods = (productsData?.items ?? []).filter(p => p.isActive);
  
  const selectedProductId = form.watch("productId");
  const availableBoms = (bomsData?.items ?? []).filter(b => 
    b.productId === selectedProductId && 
    b.isActive && 
    new Date(b.effectiveDate) <= new Date()
  );

  useEffect(() => {
    if (selectedProductId) {
      const bomsForProduct = (bomsData?.items ?? []).filter(b => 
        b.productId === selectedProductId && 
        b.isActive && 
        new Date(b.effectiveDate) <= new Date()
      );
      const currentBom = form.getValues("bomId");
      if (!bomsForProduct.some(b => b.id === currentBom)) {
        form.setValue("bomId", bomsForProduct.length === 1 ? bomsForProduct[0].id : "");
      }
    } else {
      form.setValue("bomId", "");
    }
  }, [selectedProductId, bomsData, form]);

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Create Production Plan"
      description="Create a new draft production plan for a finished product."
    >

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="" disabled>Select a product...</option>
                      {finishedGoods.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.productCode})</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BOM (Bill of Materials)</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                      disabled={!selectedProductId}
                    >
                      <option value="" disabled>Select an active BOM...</option>
                      {availableBoms.map(b => (
                        <option key={b.id} value={b.id}>{b.description || b.productName || 'BOM'} (v{b.version})</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <FormField
                control={form.control}
                name="plannedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plannedStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plannedEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" min={form.watch("plannedStartDate")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || isLoadingProducts || isLoadingBoms}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Plan
              </Button>
            </div>
          </form>
        </Form>
    </Modal>
  );
};
