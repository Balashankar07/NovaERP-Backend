import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentsApi } from "@/api/shipments.api";
import { warrantiesApi } from "@/api/warranties.api";
import { ShipmentDto } from "@/types/shipments.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Loader2, AlertCircle, Package, Truck, Calendar } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultShipmentId?: string;
  onSuccess?: () => void;
}

export const RegisterWarrantyDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  defaultShipmentId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [selectedShipmentId, setSelectedShipmentId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [warrantyType, setWarrantyType] = useState<string>("Standard Commercial");

  // Format today as YYYY-MM-DD in local time
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  // Format 1 year from today in local time
  const oneYearLaterStr = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(oneYearLaterStr);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Delivered Shipments
  const { data: shipmentsData, isLoading: isLoadingShipments } = useQuery({
    queryKey: ["delivered-shipments-for-warranty"],
    queryFn: () => shipmentsApi.getAll({ pageSize: 50 }),
    enabled: open,
    staleTime: 10000,
  });

  const deliveredShipments: ShipmentDto[] = (shipmentsData?.items || []).filter(
    (s: ShipmentDto) => String(s.status).toLowerCase() === "delivered"
  );

  // Pre-select shipment when dialog opens
  useEffect(() => {
    if (open) {
      setErrorMessage(null);
      if (defaultShipmentId) {
        setSelectedShipmentId(defaultShipmentId);
      } else if (deliveredShipments.length > 0 && !selectedShipmentId) {
        setSelectedShipmentId(deliveredShipments[0].id);
      }
    }
  }, [open, defaultShipmentId, deliveredShipments.length]);

  const activeShipment = deliveredShipments.find((s) => s.id === selectedShipmentId);

  // Pre-select product when shipment changes
  useEffect(() => {
    if (activeShipment?.shipmentItems && activeShipment.shipmentItems.length > 0) {
      setSelectedProductId(activeShipment.shipmentItems[0].productId);
    } else {
      setSelectedProductId("");
    }
  }, [selectedShipmentId, activeShipment]);

  const registerMutation = useMutation({
    mutationFn: (payload: {
      productId: string;
      shipmentId: string;
      serialNumber: string;
      warrantyType: string;
      startDate: string;
      endDate: string;
    }) => warrantiesApi.create(payload),
    onSuccess: () => {
      toast.success("Commercial warranty registered successfully!");
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      queryClient.invalidateQueries({ queryKey: ["warranty", "summary"] });
      onOpenChange(false);
      if (onSuccess) onSuccess();
      // Reset form
      setSerialNumber("");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to register warranty. Please check the details.";
      setErrorMessage(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedShipmentId) {
      setErrorMessage("Please select a delivered shipment.");
      return;
    }
    if (!selectedProductId) {
      setErrorMessage("Please select a product from the shipment.");
      return;
    }
    if (!serialNumber.trim()) {
      setErrorMessage("Serial number is required to register commercial warranty.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage("Both start and end dates are required.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage("Coverage end date cannot be earlier than start date.");
      return;
    }

    registerMutation.mutate({
      productId: selectedProductId,
      shipmentId: selectedShipmentId,
      serialNumber: serialNumber.trim(),
      warrantyType,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Register Commercial Warranty</DialogTitle>
              <DialogDescription>
                Activate formal warranty coverage for delivered customer goods with valid serial numbers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Delivered Shipment Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-indigo-600" />
              Delivered Shipment
            </Label>
            {isLoadingShipments ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading delivered shipments...
              </div>
            ) : deliveredShipments.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No delivered shipments found eligible for warranty registration.
              </p>
            ) : (
              <Select value={selectedShipmentId} onValueChange={setSelectedShipmentId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select delivered shipment..." />
                </SelectTrigger>
                <SelectContent>
                  {deliveredShipments.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.trackingNumber} {s.orderNumber ? `(${s.orderNumber})` : ""} — {s.courierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Product Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-blue-600" />
              Product
            </Label>
            {activeShipment?.shipmentItems && activeShipment.shipmentItems.length > 0 ? (
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select product..." />
                </SelectTrigger>
                <SelectContent>
                  {activeShipment.shipmentItems.map((item) => (
                    <SelectItem key={item.id} value={item.productId} className="text-xs">
                      {item.productName || item.productCode || item.productId.substring(0, 8)} (Qty: {item.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Product ID"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="h-9 text-xs"
              />
            )}
          </div>

          {/* Serial Number */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Serial Number <span className="text-rose-500">*</span>
            </Label>
            <Input
              placeholder="e.g. SN-BTS-20261025-0054"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="h-9 text-xs font-mono"
              required
            />
            <p className="text-[11px] text-slate-500">
              Enter the unique unit serial number verified from physical packaging or label.
            </p>
          </div>

          {/* Coverage Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Coverage Type
            </Label>
            <Select value={warrantyType} onValueChange={setWarrantyType}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard Commercial" className="text-xs">
                  Standard Commercial (12 Months)
                </SelectItem>
                <SelectItem value="Extended Commercial" className="text-xs">
                  Extended Commercial (24 Months)
                </SelectItem>
                <SelectItem value="Comprehensive Plus" className="text-xs">
                  Comprehensive Plus (Hardware + Labor)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" /> Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" /> End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={registerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={registerMutation.isPending || deliveredShipments.length === 0}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Registering...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Confirm Registration
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
