import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Building2, Mail, Phone, MapPin, User, Edit2 } from "lucide-react";
import type { DistributorDto } from "@/api/distributors.api";

interface DistributorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distributor: DistributorDto | null;
  onEdit?: (distributor: DistributorDto) => void;
}

export function DistributorDetailsDialog({
  open,
  onOpenChange,
  distributor,
  onEdit,
}: DistributorDetailsDialogProps) {
  if (!distributor) return null;

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Distributor Account Overview"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{distributor.companyName}</h3>
              {distributor.distributorNumber && (
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  ID: {distributor.distributorNumber}
                </p>
              )}
            </div>
          </div>
          <StatusBadge isActive={distributor.isActive} />
        </div>

        {/* Detailed Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <div className="flex items-center text-xs font-medium text-slate-400 gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Contact Person</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {distributor.contactPerson || "—"}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <div className="flex items-center text-xs font-medium text-slate-400 gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Email Address</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {distributor.email ? (
                <a
                  href={`mailto:${distributor.email}`}
                  className="text-indigo-600 hover:underline"
                >
                  {distributor.email}
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <div className="flex items-center text-xs font-medium text-slate-400 gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>Phone Number</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {distributor.phone ? (
                <a
                  href={`tel:${distributor.phone}`}
                  className="text-indigo-600 hover:underline"
                >
                  {distributor.phone}
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <div className="flex items-center text-xs font-medium text-slate-400 gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Business Address</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {distributor.address || "—"}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(distributor);
              }}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
            >
              <Edit2 className="w-4 h-4 mr-1.5" /> Edit Distributor
            </Button>
          )}
          <div className="ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
