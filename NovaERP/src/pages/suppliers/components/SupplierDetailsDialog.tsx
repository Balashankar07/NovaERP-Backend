import { useEffect, useState } from "react";
import { SupplierDto, SupplierProductDto } from "@/types/suppliers.types";
import { supplierProductsApi } from "@/api/supplierProducts.api";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, MapPin, CreditCard, Clock, FileText, CheckCircle, Package } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingView, ErrorView } from "@/components/ui/state-views";

interface SupplierDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierDto;
}

export function SupplierDetailsDialog({ isOpen, onClose, supplier }: SupplierDetailsDialogProps) {
  const [components, setComponents] = useState<SupplierProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && supplier) {
      setIsLoading(true);
      setError(null);
      supplierProductsApi.getBySupplierId(supplier.id)
        .then((data) => setComponents(data))
        .catch((err) => setError(err.message || "Failed to load components"))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, supplier]);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supplier Details"
      description="Detailed profile of the selected supplier."
    >
      <ScrollArea className="h-[70vh] pr-4 -mr-4">
        <div className="space-y-6 pb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{supplier.supplierName}</h3>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    {supplier.supplierCode} 
                    {supplier.companyName && <span>• {supplier.companyName}</span>}
                  </p>
                </div>
                {supplier.isActive ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1.5 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Contact Person</span>
                  <span className="text-sm font-medium text-slate-900">{supplier.contactPerson || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Email</span>
                    {supplier.email ? (
                      <a href={`mailto:${supplier.email}`} className="text-sm text-indigo-600 hover:underline">{supplier.email}</a>
                    ) : (
                      <span className="text-sm text-slate-700">—</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Website</span>
                    {supplier.website ? (
                      <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{supplier.website}</a>
                    ) : (
                      <span className="text-sm text-slate-700">—</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Phone</span>
                    {supplier.phone ? (
                      <a href={`tel:${supplier.phone}`} className="text-sm text-slate-700 hover:text-slate-900">{supplier.phone}</a>
                    ) : (
                      <span className="text-sm text-slate-700">—</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Mobile</span>
                    {supplier.mobile ? (
                      <a href={`tel:${supplier.mobile}`} className="text-sm text-slate-700 hover:text-slate-900">{supplier.mobile}</a>
                    ) : (
                      <span className="text-sm text-slate-700">—</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  Address Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Address Lines</span>
                  <span className="text-sm text-slate-900">{supplier.addressLine1 || "—"}</span>
                  {supplier.addressLine2 && <span className="text-sm text-slate-900">{supplier.addressLine2}</span>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">City</span>
                    <span className="text-sm text-slate-900">{supplier.city || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">State / Province</span>
                    <span className="text-sm text-slate-900">{supplier.state || "—"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Postal Code</span>
                    <span className="text-sm text-slate-900">{supplier.postalCode || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Country</span>
                    <span className="text-sm text-slate-900">{supplier.country || "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  Financial & Tax
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Tax Registration (GST/VAT)</span>
                  <span className="text-sm font-medium text-slate-900">{supplier.taxRegistrationNumber || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Currency</span>
                    <span className="text-sm font-medium text-slate-900">{supplier.currency || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Credit Limit</span>
                    <span className="text-sm font-bold text-amber-600">
                      {supplier.creditLimit != null ? formatCurrency(supplier.creditLimit) : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Payment Terms</span>
                  <span className="text-sm text-slate-900">{supplier.paymentTerms || "—"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Audit */}
            <Card className="shadow-sm border-slate-200 flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Notes & Audit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Internal Notes</span>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border p-3 rounded-md bg-slate-50">
                      {supplier.notes || "No notes available."}
                    </p>
                  </div>
                  
                  <div className="pt-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      Created: {new Date(supplier.createdAt).toLocaleString()}
                    </div>
                    {supplier.updatedAt && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        Updated: {new Date(supplier.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
            {/* Approved Components */}
            <Card className="shadow-sm border-slate-200 md:col-span-2">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <Package className="w-4 h-4 text-indigo-500" />
                  Approved Components
                </CardTitle>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
                  {components.length} Components
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-32 flex items-center justify-center">
                    <LoadingView title="Loading components..." />
                  </div>
                ) : error ? (
                  <div className="h-32 flex items-center justify-center">
                    <ErrorView title="Error" description={error} />
                  </div>
                ) : components.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-500">No components approved for this supplier yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                        <tr>
                          <th className="px-4 py-3 font-medium">Component</th>
                          <th className="px-4 py-3 font-medium">SKU</th>
                          <th className="px-4 py-3 font-medium">Unit Price</th>
                          <th className="px-4 py-3 font-medium">MOQ</th>
                          <th className="px-4 py-3 font-medium">Lead Time</th>
                          <th className="px-4 py-3 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {components.map((comp) => (
                          <tr key={comp.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{comp.productName}</div>
                              <div className="text-xs text-slate-500">{comp.productCode}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-mono text-xs">{comp.supplierSKU}</td>
                            <td className="px-4 py-3 text-slate-900 font-medium">
                              {formatCurrency(comp.unitPrice, comp.currency)}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{comp.moq}</td>
                            <td className="px-4 py-3 text-slate-700">{comp.leadTimeDays} days</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {comp.isActive ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0 text-[10px]">Active</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 px-2 py-0 text-[10px]">Inactive</Badge>
                                )}
                                {comp.isPreferred && (
                                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 px-2 py-0 text-[10px] flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Preferred
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </Modal>
  );
}
