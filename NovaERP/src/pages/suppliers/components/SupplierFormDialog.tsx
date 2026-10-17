import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SupplierDto } from "@/types/suppliers.types";
import { Loader2 } from "lucide-react";

import { useFormValidation } from "@/hooks/use-form-validation";
import { ValidationSummary } from "@/components/ui/ValidationSummary";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";

const supplierSchema = z.object({
  supplierCode: z.string().min(1, "Supplier Code is required").max(50, "Max 50 characters"),
  supplierName: z.string().min(1, "Supplier Name is required").max(100, "Max 100 characters"),
  companyName: z.string().max(100).optional().or(z.literal("")),
  contactPerson: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Invalid email format").max(100).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  mobile: z.string().max(20).optional().or(z.literal("")),
  website: z.string().url("Invalid URL format").max(200).optional().or(z.literal("")),
  addressLine1: z.string().max(200).optional().or(z.literal("")),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  taxRegistrationNumber: z.string().max(50).optional().or(z.literal("")),
  paymentTerms: z.string().max(50).optional().or(z.literal("")),
  currency: z.string().max(10).optional().or(z.literal("")),
  creditLimit: z.number().min(0, "Must be positive").optional().or(z.nan()),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: SupplierDto;
  onSubmit: (data: any) => Promise<void>;
}

export function SupplierFormDialog({
  isOpen,
  onClose,
  supplier,
  onSubmit,
}: SupplierFormDialogProps) {
  const isEditing = !!supplier;
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplierCode: "",
      supplierName: "",
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      mobile: "",
      website: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      taxRegistrationNumber: "",
      paymentTerms: "",
      currency: "",
      creditLimit: undefined,
      notes: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        form.reset({
          supplierCode: supplier.supplierCode,
          supplierName: supplier.supplierName,
          companyName: supplier.companyName || "",
          contactPerson: supplier.contactPerson || "",
          email: supplier.email || "",
          phone: supplier.phone || "",
          mobile: supplier.mobile || "",
          website: supplier.website || "",
          addressLine1: supplier.addressLine1 || "",
          addressLine2: supplier.addressLine2 || "",
          city: supplier.city || "",
          state: supplier.state || "",
          country: supplier.country || "",
          postalCode: supplier.postalCode || "",
          taxRegistrationNumber: supplier.taxRegistrationNumber || "",
          paymentTerms: supplier.paymentTerms || "",
          currency: supplier.currency || "",
          creditLimit: supplier.creditLimit ?? undefined,
          notes: supplier.notes || "",
          isActive: supplier.isActive,
        });
      } else {
        form.reset({
          supplierCode: "",
          supplierName: "",
          companyName: "",
          contactPerson: "",
          email: "",
          phone: "",
          mobile: "",
          website: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
          taxRegistrationNumber: "",
          paymentTerms: "",
          currency: "",
          creditLimit: undefined,
          notes: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, supplier, form]);

  const { globalErrors, withValidation, isSubmitting } = useFormValidation({ form });

  const handleSubmit = withValidation(async (values) => {
    const payload = {
      ...values,
      creditLimit: isNaN(values.creditLimit as number) ? null : values.creditLimit,
    };
    await onSubmit(payload);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? "Edit Supplier" : "Create Supplier"}
      description={
        supplier
          ? "Update the information for this supplier."
          : "Add a new supplier to the system."
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
          <ValidationSummary errors={globalErrors} />
          <ScrollArea className="h-[60vh] pr-4 -mr-4">
            <div className="space-y-8">
              
              {/* General Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 border-b pb-2">General Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="SUP-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Electronics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Electronics Pvt Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxRegistrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST / VAT Number</FormLabel>
                        <FormControl>
                          <Input placeholder="27XXXXX..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Contact Information</h4>
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://www.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Address</h4>
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Suite, unit, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State / Province</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="USA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Financial & Additional */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Financial & Additional</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input placeholder="USD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input placeholder="Net 30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Limit</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Status</FormLabel>
                        <p className="text-sm text-slate-500">
                          Set whether this supplier is currently active and can be selected for procurement.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Supplier" : "Save Supplier")}
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
