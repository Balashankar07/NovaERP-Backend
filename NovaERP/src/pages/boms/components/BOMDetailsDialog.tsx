import { Package, FileText, CheckCircle2, XCircle } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { BOMDto } from "@/types/boms.types";

interface BOMDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bom: BOMDto | null;
}

export function BOMDetailsDialog({ isOpen, onClose, bom }: BOMDetailsDialogProps) {
  if (!bom) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="BOM Details"
      description={`View details for BOM Version ${bom.version}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 border border-slate-100 rounded-lg p-5 bg-slate-50/50">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 flex items-center">
              <Package className="h-4 w-4 mr-2" /> Finished Product
            </p>
            <p className="text-base font-semibold text-slate-900">{bom.productName}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 flex items-center">
              <FileText className="h-4 w-4 mr-2" /> BOM Version
            </p>
            <p className="text-base font-medium text-slate-900">{bom.version}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Effective Date</p>
            <p className="text-base font-medium text-slate-900">
              {bom.effectiveDate ? new Date(bom.effectiveDate).toLocaleDateString() : "-"}
            </p>
          </div>

          <div className="space-y-1 col-span-2">
            <p className="text-sm font-medium text-slate-500">Description</p>
            <p className="text-sm text-slate-700">{bom.description || "No description provided."}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Status</p>
            <div className="flex items-center">
              {bom.isActive ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                  <XCircle className="mr-1 h-3 w-3" /> Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2">
            BOM Components ({bom.items.length})
          </h4>
          
          {bom.items.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm italic">
              No components found in this BOM.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Component
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Waste
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {bom.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                        {item.rawMaterialProductName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {item.unitName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {item.wastePercentage > 0 ? `${item.wastePercentage}%` : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 truncate max-w-[200px]" title={item.remarks}>
                        {item.remarks || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
