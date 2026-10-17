import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { useFormValidation } from "@/hooks/use-form-validation";
import { ValidationSummary } from "@/components/ui/ValidationSummary";

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
import { BrandDto, CreateBrandDto, UpdateBrandDto } from "@/types/brands.types";

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().nullable(),
  isActive: z.boolean(),
});

type BrandFormValues = z.infer<typeof brandSchema>;

interface BrandFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBrandDto | UpdateBrandDto) => Promise<void>;
  brand?: BrandDto | null;
}

export function BrandFormDialog({ isOpen, onClose, onSubmit, brand }: BrandFormDialogProps) {
  const isEditing = !!brand;

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  // Reset form when dialog opens/closes or brand changes
  React.useEffect(() => {
    if (isOpen) {
      if (brand) {
        form.reset({
          name: brand.name,
          description: brand.description || "",
          isActive: brand.isActive,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, brand, form]);

  const { globalErrors, withValidation, isSubmitting } = useFormValidation({ form });

  const handleSubmit = withValidation(async (values) => {
    // If not editing, omit isActive since it's not in CreateBrandDto
    if (isEditing) {
      await onSubmit({
        name: values.name,
        description: values.description || null,
        isActive: values.isActive,
      } as UpdateBrandDto);
    } else {
      await onSubmit({
        name: values.name,
        description: values.description || null,
      } as CreateBrandDto);
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={isEditing ? "Edit Brand" : "Create Brand"}
      description={isEditing ? "Update the details of the brand." : "Add a new brand to the system."}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
          <ValidationSummary errors={globalErrors} />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g., NovaTech" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Brief description of the brand..." 
                    {...field} 
                    value={field.value || ""} 
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditing && (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-slate-200 p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                      className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">Active Status</FormLabel>
                    <p className="text-[13px] text-slate-500">
                      Determine if this brand is available for use in the system.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isDirty}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Brand" : "Save Brand")}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
