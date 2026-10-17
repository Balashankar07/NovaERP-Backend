import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { useFormValidation } from "@/hooks/use-form-validation";
import { ValidationSummary } from "@/components/ui/ValidationSummary";

import { Role } from "@/types";
import { roleApi } from "@/api/role.api";
import { toast } from "@/utils/toast";

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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(250, "Description cannot exceed 250 characters").optional().default(""),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
  onSuccess: () => void;
}

export function RoleFormDialog({ open, onOpenChange, role, onSuccess }: RoleFormDialogProps) {
  const isEditing = !!role;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const { isSubmitting, errors: formErrors, withValidation } = useFormValidation(form);

  useEffect(() => {
    if (open) {
      if (role) {
        form.reset({
          name: role.name,
          description: role.description || "",
          isActive: role.isActive,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          isActive: true,
        });
      }
    }
  }, [open, role, form]);

  const onSubmit = withValidation(async (values: FormValues) => {
    try {
      if (isEditing) {
        await roleApi.update(role.id, {
          name: values.name,
          description: values.description
        });
        
        if (values.isActive !== role.isActive) {
          if (values.isActive) {
            await roleApi.activate(role.id);
          } else {
            await roleApi.deactivate(role.id);
          }
        }

        toast.success("Role updated successfully");
      } else {
        await roleApi.create(values);
        toast.success("Role created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save role:", error);
      throw error; // Let useFormValidation catch it to set generic API errors if needed
    }
  });

  return (
    <Modal
      title={isEditing ? "Edit Role" : "Create Role"}
      description={isEditing ? "Update the role details below." : "Enter the details for the new role."}
      isOpen={open}
      onClose={() => onOpenChange(false)}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <ValidationSummary errors={formErrors} />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Sales Manager" {...field} />
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
                  <Textarea placeholder="Describe the purpose of this role..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Active Status
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Inactive roles will disable access for all assigned users.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Role"}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
