import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { purchaseRequestsApi } from "@/api/purchaseRequests.api";
import { productsApi } from "@/api/products.api";
import { CreatePurchaseRequestDto, PurchaseRequestPriority, PurchaseRequestSource } from "@/types/purchaseRequests.types";
import { ProductDto } from "@/types/products.types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PurchaseRequestFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseRequestFormDialog({ isOpen, onClose, onSuccess }: PurchaseRequestFormDialogProps) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreatePurchaseRequestDto>({
    defaultValues: {
      requiredByDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: PurchaseRequestPriority.Normal,
      reason: "",
      source: PurchaseRequestSource.Manual,
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");

  // Fetch all component products on mount
  useEffect(() => {
    if (isOpen) {
      reset();
      setIsLoadingProducts(true);
      // Fetch products with productType 2 (Component)
      productsApi.getAll({ pageSize: 500, productType: 2 })
        .then(res => setProducts(res.items))
        .catch(() => toast.error("Failed to load products"))
        .finally(() => setIsLoadingProducts(false));
    }
  }, [isOpen, reset]);

  const handleAddComponent = (productId: string) => {
    const product = products.find(c => c.id === productId);
    if (!product) return;

    // Check if already added
    if (watchItems.some(item => item.productId === product.id)) {
      toast.error("This component is already in the request.");
      return;
    }

    append({
      productId: product.id,
      requestedQuantity: 1,
      remarks: ""
    });
  };

  const onSubmit = async (data: CreatePurchaseRequestDto) => {
    if (data.items.length === 0) {
      toast.error("Add at least one component to the purchase request.");
      return;
    }

    setIsSubmitting(true);
    try {
      await purchaseRequestsApi.create(data);
      toast.success("Purchase request created successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Request"
      description="Request components for production or inventory."
      size="4xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Header Section */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-700">Required By Date <span className="text-rose-500">*</span></Label>
            <Input 
              type="date" 
              min={new Date().toISOString().split("T")[0]}
              {...register("requiredByDate", { 
                required: "Required",
                validate: (val) => !val || new Date(val) >= new Date(new Date().setHours(0,0,0,0)) || "Required By date cannot be in the past"
              })} 
              className="bg-white" 
            />
            {errors.requiredByDate && <p className="text-xs text-rose-500">{errors.requiredByDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Priority <span className="text-rose-500">*</span></Label>
            <Select 
              value={watch("priority").toString()} 
              onValueChange={(val) => setValue("priority", parseInt(val))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PurchaseRequestPriority.Low.toString()}>Low</SelectItem>
                <SelectItem value={PurchaseRequestPriority.Normal.toString()}>Normal</SelectItem>
                <SelectItem value={PurchaseRequestPriority.High.toString()}>High</SelectItem>
                <SelectItem value={PurchaseRequestPriority.Urgent.toString()}>Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <Label className="text-slate-700">Business Reason <span className="text-rose-500">*</span></Label>
            <Textarea {...register("reason", { required: "Reason is required" })} className="bg-white" placeholder="Why are these components needed?" rows={3} />
            {errors.reason && <p className="text-xs text-rose-500">{errors.reason.message}</p>}
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Requested Components
            </h3>
            
            {/* Component Adder */}
            <div className="flex items-center gap-2 w-72">
              <Select 
                disabled={isLoadingProducts || products.length === 0}
                onValueChange={(val) => handleAddComponent(val)}
                value="" // Always reset after selection
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={
                    isLoadingProducts ? "Loading components..." : 
                    products.length === 0 ? "No components available" : 
                    "Add Component..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.productNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No components added to this request.</p>
              <p className="text-sm text-slate-400 mt-1">Select components from the dropdown above to add them.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left bg-white">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium w-1/2">Component Details</th>
                    <th className="px-4 py-3 font-medium">Quantity Requested</th>
                    <th className="px-4 py-3 font-medium">Remarks</th>
                    <th className="px-4 py-3 font-medium text-right w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((field, index) => {
                    const productInfo = products.find(p => p.id === watchItems[index].productId);
                    if (!productInfo) return null;

                    return (
                      <tr key={field.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">{productInfo.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{productInfo.productNumber}</div>
                        </td>
                        
                        <td className="px-4 py-4">
                          <Input 
                            type="number" 
                            step="0.01"
                            {...register(`items.${index}.requestedQuantity`, { valueAsNumber: true, min: 0.01 })} 
                            className="w-32"
                          />
                        </td>
                        
                        <td className="px-4 py-4">
                          <Input 
                            {...register(`items.${index}.remarks`)} 
                            placeholder="Optional notes..."
                          />
                        </td>
                        
                        <td className="px-4 py-4 text-right">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
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
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isSubmitting || fields.length === 0}
          >
            {isSubmitting ? "Creating..." : "Create Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
