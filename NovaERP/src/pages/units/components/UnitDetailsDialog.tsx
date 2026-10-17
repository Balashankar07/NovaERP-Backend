import { Modal } from "@/components/ui/modal";
import { UnitDto } from "@/types/units.types";
import { CheckCircle2, XCircle } from "lucide-react";

interface UnitDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitDto | null;
}

export function UnitDetailsDialog({ isOpen, onClose, unit }: UnitDetailsDialogProps) {
  if (!unit) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unit Details"
      description={`Viewing details for ${unit.name}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-1">Unit Name</h4>
            <p className="text-base text-slate-900 font-medium">{unit.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-1">Abbreviation</h4>
            <p className="text-base font-mono text-slate-700 bg-slate-50 border border-slate-100 rounded px-2 py-0.5 inline-block">{unit.abbreviation}</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
          {unit.description ? (
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {unit.description}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">No description provided.</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-1">Status</h4>
          <div className="flex items-center space-x-2 mt-1">
            {unit.isActive ? (
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
          <h4 className="text-sm font-medium text-slate-500 mb-1">Unit ID</h4>
          <p className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block break-all">
            {unit.id}
          </p>
        </div>
      </div>
    </Modal>
  );
}
