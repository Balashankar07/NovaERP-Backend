import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { useFormValidation } from "@/hooks/use-form-validation";
import { ValidationSummary } from "@/components/ui/ValidationSummary";

import { User, Role } from "@/types";
import { userApi } from "@/api/user.api";
import { roleApi } from "@/api/role.api";
import { permissionsApi } from "@/api/permissions.api";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().default(""),
  companyId: z.string().uuid("Invalid company ID").optional().or(z.literal("")),
  roleIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  googleSubjectId: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onSuccess: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const isEditing = !!user;
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyId: "",
      roleIds: [],
      isActive: true,
    },
  });

  const { isSubmitting, errors: formErrors, withValidation } = useFormValidation(form);

  useEffect(() => {
    if (open) {
      loadRoles();
      if (user) {
        form.reset({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || "",
          companyId: user.companyId || "",
          roleIds: user.roleIds || [],
          isActive: user.isActive,
          googleSubjectId: "", // Since it's only set manually or not returned from backend, we can just leave it empty or map it if it exists.
        });
      } else {
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          companyId: "",
          roleIds: [],
          isActive: true,
          googleSubjectId: "",
        });
      }
    }
  }, [open, user, form]);

  const selectedRoleIds = form.watch("roleIds");

  useEffect(() => {
    if (!open) return;
    
    const fetchPermissions = async () => {
      if (!selectedRoleIds || selectedRoleIds.length === 0) {
        setRolePermissions([]);
        return;
      }
      
      try {
        setIsLoadingPermissions(true);
        const permsSet = new Set<string>();
        
        for (const roleId of selectedRoleIds) {
          const perms = await permissionsApi.getByRoleId(roleId);
          if (Array.isArray(perms)) {
            perms.forEach((p: any) => permsSet.add(p.name || p));
          } else if (perms && (perms as any).items) {
            (perms as any).items.forEach((p: any) => permsSet.add(p.name || p));
          }
        }
        
        setRolePermissions(Array.from(permsSet));
      } catch (error) {
        console.error("Failed to fetch role permissions:", error);
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    
    fetchPermissions();
  }, [selectedRoleIds, open]);

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const res = await roleApi.getAll({ pageSize: 100 });
      setAvailableRoles(res.items || []);
    } catch (err) {
      toast.error("Failed to load roles");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const onSubmit = withValidation(async (values: FormValues) => {
    try {
      if (isEditing) {
        const updatePayload = {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || "",
          companyId: values.companyId || "00000000-0000-0000-0000-000000000000",
          googleSubjectId: values.googleSubjectId ? values.googleSubjectId : undefined
        };
        await userApi.update(user.id, updatePayload);

        // Handle Active State
        if (values.isActive !== user.isActive) {
          if (values.isActive) {
            await userApi.activate(user.id);
          } else {
            await userApi.deactivate(user.id);
          }
        }

        // Handle Roles
        const initialRoleIds = new Set(user.roleIds || []);
        const currentRoleIds = new Set(values.roleIds);

        // Roles to Add
        for (const roleId of currentRoleIds) {
          if (!initialRoleIds.has(roleId)) {
            await userApi.assignRole(user.id, roleId);
          }
        }

        // Roles to Remove
        for (const roleId of initialRoleIds) {
          if (!currentRoleIds.has(roleId)) {
            await userApi.removeRole(user.id, roleId);
          }
        }

        toast.success("User updated successfully");
      } else {
        const createPayload = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || "",
          password: "", // Handled by backend randomly for Google Auth
          companyId: values.companyId || "00000000-0000-0000-0000-000000000000",
          roleIds: values.roleIds
        };
        await userApi.create(createPayload);
        toast.success("User created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save user:", error);
      throw error;
    }
  });

  const activeRoles = availableRoles.filter(r => r.isActive);

  return (
    <Modal
      title={isEditing ? "Edit User" : "Create User"}
      description={isEditing ? "Update user profile and access." : "Create a new user and assign roles."}
      isOpen={open}
      onClose={() => onOpenChange(false)}
      className="max-w-2xl"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <ValidationSummary errors={formErrors} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
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
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" disabled={isEditing} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 8900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="googleSubjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Subject ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Google Subject ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="font-semibold text-slate-900 mb-3">Roles & Permissions</h4>
            {isLoadingRoles ? (
              <div className="text-sm text-slate-500 py-4">Loading available roles...</div>
            ) : (
              <FormField
                control={form.control}
                name="roleIds"
                render={() => (
                  <FormItem>
                    
                    <div className="space-y-4">
                      {activeRoles.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-slate-700 mb-2">Available Roles</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeRoles.map((role) => (
                              <FormField
                                key={role.id}
                                control={form.control}
                                name="roleIds"
                                render={({ field }) => (
                                  <FormItem
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(role.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, role.id])
                                            : field.onChange(field.value?.filter((value) => value !== role.id))
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="font-medium cursor-pointer">
                                        {role.name}
                                      </FormLabel>
                                      <p className="text-xs text-slate-500 truncate" title={role.description}>
                                        {role.description}
                                      </p>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {selectedRoleIds.length > 0 && (
              <div className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-200">
                <h5 className="text-sm font-semibold text-slate-900 mb-2">Role Permissions Summary</h5>
                {isLoadingPermissions ? (
                  <div className="text-xs text-slate-500 flex items-center"><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Loading permissions...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 block text-xs">Total Permissions</span>
                      <span className="font-medium text-slate-900">{rolePermissions.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Major Modules</span>
                      <span className="font-medium text-slate-900">
                        {Array.from(new Set(rolePermissions.map(p => {
                          const parts = p.split('.');
                          return parts.length > 1 ? parts[1] : p;
                        }))).slice(0, 5).join(', ')}
                        {new Set(rolePermissions.map(p => p.split('.')[1])).size > 5 ? '...' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-amber-50/30">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Active Account
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Deactivating this user will immediately revoke their access to the system.
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save User"}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
