import { useEffect, useState } from "react";
import { ProductDto, ProductType } from "@/types/products.types";
import { SupplierProductDto } from "@/types/suppliers.types";
import { supplierProductsApi } from "@/api/supplierProducts.api";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Box, Hash, Tag, FileJson, Building2, CheckCircle } from "lucide-react";
import { LoadingView, ErrorView } from "@/components/ui/state-views";

interface ProductDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDto;
}

export function ProductDetailsDialog({ isOpen, onClose, product }: ProductDetailsDialogProps) {
  const [suppliers, setSuppliers] = useState<SupplierProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product && product.productType === ProductType.Component) {
      setIsLoading(true);
      setError(null);
      supplierProductsApi.getByProduct(product.id)
        .then((data) => setSuppliers(data))
        .catch((err) => setError(err.message || "Failed to load suppliers"))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, product]);
  const getProductTypeBadge = (type: ProductType) => {
    if (type === ProductType.FinishedGood) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Finished Good</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Component</Badge>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Details"
      description="Detailed master information for this product."
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex gap-6 items-start">
          <div className="flex-shrink-0 w-32 h-32 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shadow-sm">
            <ImageWithFallback src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-grow space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getProductTypeBadge(product.productType)}
                  {product.isActive ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Inactive
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">{product.description}</p>
                )}
              </div>
            </div>
            
            {/* Identifiers Grid */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                <Hash className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700">{product.productNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                <Tag className="w-4 h-4 text-slate-400" />
                <span>Code: <span className="font-semibold text-slate-700">{product.productCode}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                <Box className="w-4 h-4 text-slate-400" />
                <span>SKU: <span className="font-semibold text-slate-700">{product.sku}</span></span>
              </div>
              {product.barcode && (
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{product.barcode}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Brand</h4>
            <p className="text-sm text-slate-900 font-medium">{product.brand?.name || "-"}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</h4>
            <p className="text-sm text-slate-900 font-medium">{product.category?.name || "-"}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unit of Measure</h4>
            <p className="text-sm text-slate-900 font-medium">{product.unit?.name || "-"}</p>
          </div>
        </div>

        {/* Pricing & Inventory grids */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Pricing Structure</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Cost Price</span>
                <span className="text-sm font-bold text-slate-700">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 -mx-2 px-2 py-1.5 rounded-md">
                <span className="text-sm font-medium text-slate-900">Selling Price</span>
                <span className="text-sm font-bold text-indigo-700">{formatCurrency(product.sellingPrice)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500">Margin</span>
                <span className="text-xs font-medium text-emerald-600">
                  {product.costPrice > 0 
                    ? `${(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)}%` 
                    : '100%'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Inventory Control</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Minimum Stock</span>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{product.minimumStock}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Reorder Level</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{product.reorderLevel}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Maximum Stock</span>
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{product.maximumStock}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <FileJson className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Technical Specifications</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {product.specifications.map((spec, i) => (
                <div key={spec.id || i} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-medium text-slate-500">{spec.attributeName}</span>
                  <span className="text-sm font-semibold text-slate-800">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Suppliers */}
        {product.productType === ProductType.Component && (
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Suppliers</h4>
              </div>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
                {suppliers.length} Suppliers
              </Badge>
            </div>
            
            <div className="p-0">
              {isLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <LoadingView title="Loading suppliers..." />
                </div>
              ) : error ? (
                <div className="h-32 flex items-center justify-center">
                  <ErrorView title="Error" description={error} />
                </div>
              ) : suppliers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-500">No suppliers approved for this component yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">Supplier</th>
                        <th className="px-4 py-3 font-medium">SKU</th>
                        <th className="px-4 py-3 font-medium">Unit Price</th>
                        <th className="px-4 py-3 font-medium">MOQ</th>
                        <th className="px-4 py-3 font-medium">Lead Time</th>
                        <th className="px-4 py-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {suppliers.map((supp) => (
                        <tr key={supp.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{supp.supplierName}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-mono text-xs">{supp.supplierSKU}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium">
                            {formatCurrency(supp.unitPrice, supp.currency)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{supp.moq}</td>
                          <td className="px-4 py-3 text-slate-700">{supp.leadTimeDays} days</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {supp.isActive ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0 text-[10px]">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 px-2 py-0 text-[10px]">Inactive</Badge>
                              )}
                              {supp.isPreferred && (
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
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
