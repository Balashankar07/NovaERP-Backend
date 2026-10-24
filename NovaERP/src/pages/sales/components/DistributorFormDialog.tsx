import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { distributorsApi, DistributorDto, CreateDistributorDto, UpdateDistributorDto } from "@/api/distributors.api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface DistributorFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
}

interface DistributorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distributor?: DistributorDto | null;
  onSuccess: () => void;
}

export function DistributorFormDialog({
  open,
  onOpenChange,
  distributor,
  onSuccess,
}: DistributorFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!distributor;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DistributorFormData>({
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      isActive: true,
    },
  });

  const isActiveValue = watch("isActive");

  useEffect(() => {
    if (open) {
      if (distributor) {
        reset({
          companyName: distributor.companyName || "",
          contactPerson: distributor.contactPerson || "",
          email: distributor.email || "",
          phone: distributor.phone || "",
          address: distributor.address || "",
          isActive: distributor.isActive ?? true,
        });
      } else {
        reset({
          companyName: "",
          contactPerson: "",
          email: "",
          phone: "",
          address: "",
          isActive: true,
        });
      }
    }
  }, [open, distributor, reset]);

  const onSubmit = async (data: DistributorFormData) => {
    try {
      setLoading(true);
      if (isEditing && distributor) {
        const updatePayload: UpdateDistributorDto = {
          companyName: data.companyName.trim(),
          contactPerson: data.contactPerson.trim(),
          email: data.email.trim(),
          phone: data.phone?.trim() || "",
          address: data.address?.trim() || "",
          isActive: data.isActive,
        };
        await distributorsApi.updateDistributor(distributor.id, updatePayload);
        toast.success("Distributor account updated successfully.");
      } else {
        const createPayload: CreateDistributorDto = {
          companyName: data.companyName.trim(),
          contactPerson: data.contactPerson.trim(),
          email: data.email.trim(),
          phone: data.phone?.trim() || "",
          address: data.address?.trim() || "",
        };
        await distributorsApi.createDistributor(createPayload);
        toast.success("Distributor account created successfully.");
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${isEditing ? "update" : "create"} distributor`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={isEditing ? "Update Distributor Account" : "Add New Distributor"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">
            Company Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="companyName"
            {...register("companyName", {
              required: "Company Name is required",
              validate: (val) => !!val?.trim() || "Company Name cannot be blank",
            })}
            placeholder="Enter distributor company name"
            disabled={loading}
          />
          {errors.companyName && (
            <span className="text-sm text-red-500">{errors.companyName.message}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPerson">
              Contact Person <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactPerson"
              {...register("contactPerson", {
                required: "Contact Person is required",
                validate: (val) => !!val?.trim() || "Contact Person cannot be blank",
              })}
              placeholder="e.g., John Sales"
              disabled={loading}
            />
            {errors.contactPerson && (
              <span className="text-sm text-red-500">{errors.contactPerson.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format",
                },
              })}
              placeholder="e.g., distributor@company.com"
              disabled={loading}
            />
            {errors.email && (
              <span className="text-sm text-red-500">{errors.email.message}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="e.g., +1 555-0199"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="e.g., 100 Logistics Blvd, Suite 200"
              disabled={loading}
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center space-x-3 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
            <Checkbox
              id="isActive"
              checked={isActiveValue}
              onCheckedChange={(checked) => setValue("isActive", checked === true)}
              disabled={loading}
            />
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-sm font-medium text-slate-900 cursor-pointer">
                Active Account Status
              </Label>
              <p className="text-xs text-slate-500">
                Active distributors can be selected for new sales orders, quotations, and shipments.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={loading}
          >
            {loading
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Distributor"
              : "Create Distributor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
