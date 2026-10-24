import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { productionApi } from "@/api/production.api";
import { CreateProductionOrderDto, ProductionOrderPriority, ProductionPlanStatus } from "@/types/production.types";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
const formSchema = z.object({
  productionPlanId: z.string().min(1, "Production Plan is required"),
  plannedQuantity: z.coerce.number().min(0.01, "Quantity must be greater than zero"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProductionOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultPlanId?: string;
}

export const CreateProductionOrderDialog = ({
  open,
  onOpenChange,
  onSuccess,
  defaultPlanId,
}: CreateProductionOrderDialogProps) => {
  const queryClient = useQueryClient();

  // Fetch production plans to select from (ideally filtered by Released, but we fetch all and filter locally for now)
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["production-plans-for-order"],
    queryFn: () => productionApi.getAllPlans({ pageSize: 100 }), // Increased page size to get enough plans
    enabled: open,
  });

  // Released plans (Status 2 or 'Released')
  const releasedPlans = (plansData?.items || []).filter(
    p => String(p.status).toLowerCase() === '2' || String(p.status).toLowerCase() === 'released'
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productionPlanId: "",
      plannedQuantity: 1,
    },
  });

  // Watch plan selection to auto-fill details
  const selectedPlanId = form.watch("productionPlanId");

  useEffect(() => {
    if (open && defaultPlanId) {
      form.setValue("productionPlanId", defaultPlanId);
    }
  }, [open, defaultPlanId, form]);

  useEffect(() => {
    if (selectedPlanId && releasedPlans.length > 0) {
      const plan = releasedPlans.find(p => p.id === selectedPlanId);
      if (plan) {
        form.setValue("plannedQuantity", plan.plannedQuantity);
      }
    }
  }, [selectedPlanId, releasedPlans, form]);

  const mutation = useMutation({
    mutationFn: (data: CreateProductionOrderDto) => productionApi.createOrder(data),
    onSuccess: () => {
      toast.success("Production order created successfully");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create production order");
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate({
      productionPlanId: data.productionPlanId,
      plannedQuantity: data.plannedQuantity,
      priority: ProductionOrderPriority.Medium,
    });
  };

  const selectedPlanDetails = releasedPlans.find(p => p.id === selectedPlanId);

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      title="Create Production Order"
      description="Create a new manufacturing order from a released production plan."
      className="sm:max-w-[600px]"
    >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productionPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Plan <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingPlans ? "Loading plans..." : "Select a released plan"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {releasedPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.planNumber} - {plan.productName || plan.productId}
                        </SelectItem>
                      ))}
                      {releasedPlans.length === 0 && !isLoadingPlans && (
                        <SelectItem value="none" disabled>No released plans available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPlanDetails && (
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 border border-slate-100 flex flex-col gap-1">
                <p><strong>Product:</strong> {selectedPlanDetails.productName || selectedPlanDetails.productId}</p>
                <p><strong>Plan Quantity:</strong> {selectedPlanDetails.plannedQuantity}</p>
              </div>
            )}

              <FormField
                control={form.control}
                name="plannedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Quantity <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </div>
          </form>
        </Form>
    </Modal>
  );
};
