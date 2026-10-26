import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { productionApi } from "@/api/production.api";
import { CreateProductionOrderDto, ProductionOrderPriority } from "@/types/production.types";

import { toast } from "sonner";
import { Loader2, AlertCircle, Info } from "lucide-react";
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

const formSchema = z.object({
  productionPlanId: z.string().min(1, "Production Plan is required"),
  plannedQuantity: z.coerce.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1").max(100000, "Quantity cannot exceed 100,000 units"),
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

  // Fetch production plans
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["production-plans-for-order"],
    queryFn: () => productionApi.getAllPlans({ pageSize: 500 }),
    enabled: open,
  });

  // Fetch existing orders to calculate capacity per plan
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["production-orders-for-capacity"],
    queryFn: () => productionApi.getAllOrders({ pageSize: 500 }),
    enabled: open,
  });

  // Calculate capacity for all released plans
  const releasedPlansWithCapacity = useMemo(() => {
    const plans = (plansData?.items || []).filter(
      p => String(p.status).toLowerCase() === '2' || String(p.status).toLowerCase() === 'released'
    );
    const orders = ordersData?.items || [];

    return plans.map(plan => {
      const activeOrders = orders.filter(
        o => o.productionPlanId === plan.id &&
             String(o.status).toLowerCase() !== '4' &&
             String(o.status).toLowerCase() !== 'cancelled'
      );
      const allocated = activeOrders.reduce((sum, o) => sum + (Number(o.plannedQuantity) || 0), 0);
      const remaining = Math.max(0, (Number(plan.plannedQuantity) || 0) - allocated);
      return {
        ...plan,
        allocated,
        remaining,
        hasCapacity: remaining > 0,
      };
    });
  }, [plansData, ordersData]);

  const eligiblePlans = useMemo(() => {
    return releasedPlansWithCapacity.filter(p => p.hasCapacity);
  }, [releasedPlansWithCapacity]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productionPlanId: "",
      plannedQuantity: 1,
    },
  });

  const selectedPlanId = form.watch("productionPlanId");
  const formPlannedQuantity = form.watch("plannedQuantity") || 0;

  const selectedPlan = releasedPlansWithCapacity.find(p => p.id === selectedPlanId);
  const remainingCapacity = selectedPlan?.remaining ?? 0;
  const isOverAllocated = selectedPlan ? formPlannedQuantity > remainingCapacity : false;
  const isZeroCapacity = !selectedPlan || selectedPlan.remaining <= 0;

  // Track if defaultPlanId was replaced due to zero capacity
  const [switchedNotice, setSwitchedNotice] = useState<{ originalPlanNumber?: string; newPlanNumber?: string } | null>(null);

  // Auto-selection effect when dialog opens or data is loaded
  useEffect(() => {
    if (!open || releasedPlansWithCapacity.length === 0) return;

    const currentPlanId = form.getValues("productionPlanId");
    const currentSelected = releasedPlansWithCapacity.find(p => p.id === currentPlanId);

    // If defaultPlanId is supplied
    if (defaultPlanId) {
      const defaultPlan = releasedPlansWithCapacity.find(p => p.id === defaultPlanId);
      if (defaultPlan && defaultPlan.hasCapacity) {
        if (currentPlanId !== defaultPlanId) {
          form.setValue("productionPlanId", defaultPlanId);
          form.setValue("plannedQuantity", defaultPlan.remaining);
          setSwitchedNotice(null);
        }
        return;
      }
      // If defaultPlan is fully allocated (0 capacity), switch to best eligible plan
      if (defaultPlan && !defaultPlan.hasCapacity && eligiblePlans.length > 0) {
        const bestPlan = eligiblePlans.find(p => p.remaining >= 1) || eligiblePlans[0];
        form.setValue("productionPlanId", bestPlan.id);
        form.setValue("plannedQuantity", bestPlan.remaining);
        setSwitchedNotice({
          originalPlanNumber: defaultPlan.planNumber,
          newPlanNumber: bestPlan.planNumber,
        });
        return;
      }
    }

    // If current plan already has positive capacity, keep it and adjust quantity if needed
    if (currentSelected && currentSelected.hasCapacity) {
      const currentQty = form.getValues("plannedQuantity") || 0;
      if (currentQty <= 0 || currentQty > currentSelected.remaining) {
        form.setValue("plannedQuantity", currentSelected.remaining);
      }
      return;
    }

    // If currently selected plan has 0 capacity or nothing is selected, pick the best eligible plan
    if (eligiblePlans.length > 0) {
      const requestedQty = form.getValues("plannedQuantity") || 1;
      const bestPlan = eligiblePlans.find(p => p.remaining >= requestedQty) || eligiblePlans[0];
      form.setValue("productionPlanId", bestPlan.id);
      form.setValue("plannedQuantity", bestPlan.remaining);
    } else {
      // No eligible plans with capacity exist
      form.setValue("productionPlanId", "");
      form.setValue("plannedQuantity", 1);
    }
  }, [open, defaultPlanId, releasedPlansWithCapacity, eligiblePlans, form]);

  // Handle plan change from user selection
  const handlePlanChange = (newPlanId: string) => {
    form.setValue("productionPlanId", newPlanId);
    setSwitchedNotice(null);
    const chosenPlan = releasedPlansWithCapacity.find(p => p.id === newPlanId);
    if (chosenPlan) {
      form.setValue("plannedQuantity", chosenPlan.remaining > 0 ? chosenPlan.remaining : 1);
    }
  };

  const mutation = useMutation({
    mutationFn: (data: CreateProductionOrderDto) => productionApi.createOrder(data),
    onSuccess: () => {
      toast.success("Production order created successfully");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["production-orders-for-capacity"] });
      queryClient.invalidateQueries({ queryKey: ["production"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create production order");
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!selectedPlan || isZeroCapacity || isOverAllocated) return;

    mutation.mutate({
      productionPlanId: data.productionPlanId,
      plannedQuantity: data.plannedQuantity,
      priority: ProductionOrderPriority.Medium,
    });
  };

  const noEligiblePlans = eligiblePlans.length === 0 && !isLoadingPlans && !isLoadingOrders;

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      title="Create Production Order"
      description="Create a new manufacturing order from an eligible released production plan."
      className="sm:max-w-[600px]"
    >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {switchedNotice && (
              <div className="rounded-md bg-sky-50 p-3 border border-sky-200 text-sky-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Plan {switchedNotice.originalPlanNumber} is fully allocated (0 capacity).</span>
                  <span className="block text-sky-700 mt-0.5">
                    Automatically selected eligible plan <strong>{switchedNotice.newPlanNumber}</strong> with available capacity.
                  </span>
                </div>
              </div>
            )}

            {noEligiblePlans && (
              <div className="rounded-md bg-amber-50 p-4 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">No Released Plans with Available Capacity</h4>
                  <p className="mt-1 text-xs text-amber-700">
                    All existing released production plans have been fully allocated to production orders. A released plan with positive available capacity is required to create a new production order.
                  </p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="productionPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Plan <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={handlePlanChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingPlans || isLoadingOrders ? "Loading plans & capacity..." : "Select an eligible released plan"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {releasedPlansWithCapacity.map((plan) => (
                        <SelectItem 
                          key={plan.id} 
                          value={plan.id}
                          disabled={!plan.hasCapacity}
                          className={!plan.hasCapacity ? "opacity-50 text-slate-400 cursor-not-allowed" : ""}
                        >
                          {plan.planNumber} - {plan.productName || plan.productId} {plan.hasCapacity ? `(${plan.remaining} of ${plan.plannedQuantity} available)` : `(Fully Allocated - 0 of ${plan.plannedQuantity} available)`}
                        </SelectItem>
                      ))}
                      {releasedPlansWithCapacity.length === 0 && !isLoadingPlans && (
                        <SelectItem value="none" disabled>No released plans available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPlan && (
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 border border-slate-100 flex flex-col gap-2">
                <div>
                  <p><strong>Product:</strong> {selectedPlan.productName || selectedPlan.productId}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-200">
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="text-slate-500 block">Plan Quantity</span>
                    <span className="font-semibold text-slate-800 text-sm">{selectedPlan.plannedQuantity}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="text-slate-500 block">Allocated in Orders</span>
                    <span className="font-semibold text-slate-800 text-sm">{selectedPlan.allocated}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="text-slate-500 block">Remaining Capacity</span>
                    <span className={`font-semibold text-sm ${selectedPlan.remaining > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                      {selectedPlan.remaining}
                    </span>
                  </div>
                </div>
                {selectedPlan.remaining <= 0 && (
                  <div className="text-amber-800 bg-amber-50 p-2 rounded text-xs border border-amber-200 font-medium">
                    Warning: This plan's full quantity has already been allocated to existing production orders.
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="plannedQuantity"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Planned Quantity <span className="text-red-500">*</span></FormLabel>
                    {selectedPlan && selectedPlan.remaining > 0 && (
                      <span className="text-xs text-slate-500">
                        Max available: <strong className="text-emerald-600">{selectedPlan.remaining}</strong>
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="1" 
                      min="1" 
                      max={selectedPlan?.remaining || 100000}
                      {...field} 
                      onKeyDown={(e) => {
                        if (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "-") {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  {isOverAllocated && (
                    <p className="text-xs font-medium text-red-600 mt-1">
                      Planned quantity ({formPlannedQuantity}) exceeds remaining capacity ({remainingCapacity}) on this plan.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending || isZeroCapacity || isOverAllocated || formPlannedQuantity <= 0 || noEligiblePlans}
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </div>
          </form>
        </Form>
    </Modal>
  );
};
