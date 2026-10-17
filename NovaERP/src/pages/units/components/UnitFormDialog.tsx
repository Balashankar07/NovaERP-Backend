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
import { UnitDto, CreateUnitDto, UpdateUnitDto } from "@/types/units.types";

const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  description: z.string().nullable(),
  isActive: z.boolean(),
});

type UnitFormValues = z.infer<typeof unitSchema>;

interface UnitFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUnitDto | UpdateUnitDto) => Promise<void>;
  unit?: UnitDto | null;
}

export function UnitFormDialog({ isOpen, onClose, onSubmit, unit }: UnitFormDialogProps) {
  const isEditing = !!unit;

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      description: "",
      isActive: true,
    },
  });

  // Reset form when dialog opens/closes or unit changes
  React.useEffect(() => {
    if (isOpen) {
      if (unit) {
        form.reset({
          name: unit.name,
          abbreviation: unit.abbreviation,
          description: unit.description || "",
          isActive: unit.isActive,
        });
      } else {
        form.reset({
          name: "",
          abbreviation: "",
          description: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, unit, form]);

  const { globalErrors, withValidation, isSubmitting } = useFormValidation({ form });

  const handleSubmit = withValidation(async (values) => {
    if (isEditing) {
      await onSubmit({
        name: values.name,
        abbreviation: values.abbreviation,
        description: values.description || null,
        isActive: values.isActive,
      } as UpdateUnitDto);
    } else {
      await onSubmit({
        name: values.name,
        abbreviation: values.abbreviation,
        description: values.description || null,
      } as CreateUnitDto);
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={isEditing ? "Edit Unit" : "Create Unit"}
      description={isEditing ? "Update the details of the unit of measurement." : "Add a new unit of measurement to the system."}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
          <ValidationSummary errors={globalErrors} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Kilogram" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abbreviation <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., kg" {...field} disabled={isSubmitting} />
                  </FormControl>
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
                  <Input 
                    placeholder="Brief description of the unit..." 
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
                      Determine if this unit is available for use in the system.
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
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Unit" : "Save Unit")}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
