import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "@/utils/toast";
import type { User, UpdateUserRequest } from "@/types";

import { useFormValidation } from "@/hooks/use-form-validation";
import { ValidationSummary } from "@/components/ui/ValidationSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { userApi } from "@/api/user.api";

const personalInfoSchema = z.object({
  firstName: z.string().trim().min(1, "First Name is required"),
  lastName: z.string().trim().min(1, "Last Name is required"),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone number cannot exceed 20 characters"),
  // Read-only fields for context
  email: z.string(),
  roleIds: z.array(z.string()),
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

interface PersonalInfoTabProps {
  user: User;
  onUpdate: () => void;
}

export function PersonalInfoTab({ user, onUpdate }: PersonalInfoTabProps) {
  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      email: user.email || "",
      roleIds: user.roleIds || [],
    },
  });

  useEffect(() => {
    form.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      email: user.email || "",
      roleIds: user.roleIds || [],
    });
  }, [user, form]);

  const { globalErrors, withValidation, isSubmitting } = useFormValidation({ form });

  const onSubmit = withValidation(async (values) => {
    const updateData: UpdateUserRequest = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      companyId: user.companyId,
      roleIds: user.roleIds,
      isActive: user.isActive,
    };
    await userApi.update(user.id, updateData);
    toast.success("Personal information updated successfully.");
    onUpdate();
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 md:p-8">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
        <p className="text-sm text-slate-500 mt-1">Update your basic profile details.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl" noValidate>
          <ValidationSummary errors={globalErrors} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Doe" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g., +1 555-0123" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address (Read Only)</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role(s) (Read Only)</FormLabel>
                  <FormControl>
                    <Input value={field.value?.join(", ")} disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isDirty}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
