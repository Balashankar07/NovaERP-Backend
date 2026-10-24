import { useState } from "react";
import { useForm } from "react-hook-form";
import { distributorsApi, CreateDistributorDto } from "@/api/distributors.api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateDistributorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDistributorDialog({ open, onOpenChange, onSuccess }: CreateDistributorDialogProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateDistributorDto>();

  const onSubmit = async (data: CreateDistributorDto) => {
    try {
      setLoading(true);
      await distributorsApi.createDistributor(data);
      toast.success("Distributor created successfully.");
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create distributor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => { reset(); onOpenChange(false); }} title="Add New Distributor" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name *</Label>
          <Input 
            id="companyName" 
            {...register("companyName", { 
              required: "Company Name is required",
              validate: (val) => !!val?.trim() || "Company Name cannot be blank"
            })} 
            placeholder="Enter company name"
          />
          {errors.companyName && <span className="text-sm text-red-500">{errors.companyName.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person *</Label>
            <Input 
              id="contactPerson" 
              {...register("contactPerson", { 
                required: "Contact Person is required",
                validate: (val) => !!val?.trim() || "Contact Person cannot be blank"
              })} 
              placeholder="e.g. John Doe"
            />
            {errors.contactPerson && <span className="text-sm text-red-500">{errors.contactPerson.message}</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input 
              id="email" 
              type="email"
              {...register("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format"
                }
              })} 
              placeholder="e.g. john@company.com"
            />
            {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              {...register("phone")} 
              placeholder="e.g. +1 555-0123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              {...register("address")} 
              placeholder="Enter full address"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
            {loading ? "Creating..." : "Create Distributor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
