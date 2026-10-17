import { Modal } from "@/components/ui/modal";
import { BrandDto } from "@/types/brands.types";
import { CheckCircle2, XCircle } from "lucide-react";

interface BrandDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BrandDto | null;
}

export function BrandDetailsDialog({ isOpen, onClose, brand }: BrandDetailsDialogProps) {
  if (!brand) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Brand Details"
      description={`Viewing details for ${brand.name}`}
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-1">Brand Name</h4>
          <p className="text-base text-slate-900 font-medium">{brand.name}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
          {brand.description ? (
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {brand.description}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">No description provided.</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-1">Status</h4>
          <div className="flex items-center space-x-2 mt-1">
            {brand.isActive ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Inactive
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-1">Brand ID</h4>
          <p className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
            {brand.id}
          </p>
        </div>
      </div>
    </Modal>
  );
}
