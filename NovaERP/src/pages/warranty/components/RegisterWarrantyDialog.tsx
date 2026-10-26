import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentsApi } from "@/api/shipments.api";
import { warrantiesApi, EligibleShipmentDto } from "@/api/warranties.api";
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

  // Fetch Delivered Shipments Eligible for Warranty
  const { data: eligibleShipments, isLoading: isLoadingShipments, refetch: refetchShipments } = useQuery<EligibleShipmentDto[]>({
    queryKey: ["eligible-shipments-for-warranty"],
    queryFn: async () => {
      try {
        const res = await warrantiesApi.getEligibleShipments();
        if (Array.isArray(res) && res.length > 0) {
          return res;
        }
      } catch {
        // Continue to fallback
      }

      // Fallback: fetch via shipmentsApi if dedicated endpoint is unavailable
      try {
        const fallback = await shipmentsApi.getAll({ pageSize: 100 });
        const delivered = (fallback?.items || []).filter(
          (s: ShipmentDto) => String(s.status).toLowerCase() === "delivered"
        );
        return delivered.map((s: ShipmentDto) => ({
          id: s.id,
          trackingNumber: s.trackingNumber,
          courierName: s.courierName,
          deliveryDate: s.deliveryDate,
          orderNumber: s.orderNumber,
          customerName: s.customerName,
          items: (s.shipmentItems || []).map((i) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName || i.productCode || "Product",
            productCode: i.productCode,
            sku: i.productCode,
            quantity: i.quantity,
            registeredWarrantyCount: 0,
            remainingEligibleQuantity: i.quantity,
          })),
        }));
      } catch {
        return [];
      }
    },
    enabled: open,
    staleTime: 5000,
  });

  const deliveredShipments: EligibleShipmentDto[] = eligibleShipments || [];

  // Pre-select shipment when dialog opens or data updates
  useEffect(() => {
    if (open) {
      setErrorMessage(null);
      if (defaultShipmentId && deliveredShipments.some((s) => s.id === defaultShipmentId)) {
        setSelectedShipmentId(defaultShipmentId);
      } else if (deliveredShipments.length > 0 && (!selectedShipmentId || !deliveredShipments.some((s) => s.id === selectedShipmentId))) {
        // Prefer shipment with remaining eligible items
        const preferred = deliveredShipments.find((s) => s.items.some((i) => i.remainingEligibleQuantity > 0)) || deliveredShipments[0];
        setSelectedShipmentId(preferred.id);
      }
    }
  }, [open, defaultShipmentId, deliveredShipments]);

  const activeShipment = deliveredShipments.find((s) => s.id === selectedShipmentId);

  // Fetch Auto-Incremented Serial Number for selected Product
  const {
    data: nextSerialData,
    isLoading: isLoadingSerial,
    error: serialError,
    refetch: refetchSerial,
  } = useQuery({
    queryKey: ["next-serial-number", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return "";
      try {
        const res: any = await warrantiesApi.getNextSerialNumber(selectedProductId);
        if (typeof res === "string") return res;
        if (res?.data?.serialNumber) return res.data.serialNumber;
        if (typeof res?.data === "string") return res.data;
        if (res?.serialNumber) return res.serialNumber;
        return "";
      } catch (err: any) {
        throw new Error(
          err?.response?.data?.message || err?.message || "Failed to generate serial number"
        );
      }
    },
    enabled: open && !!selectedProductId,
    staleTime: 0,
  });

  useEffect(() => {
    if (nextSerialData) {
      setSerialNumber(nextSerialData);
    } else if (!selectedProductId) {
      setSerialNumber("");
    }
  }, [nextSerialData, selectedProductId]);

  // Pre-select product when active shipment changes
  useEffect(() => {
    if (activeShipment?.items && activeShipment.items.length > 0) {
      const eligibleItem = activeShipment.items.find((i) => i.remainingEligibleQuantity > 0) || activeShipment.items[0];
      setSelectedProductId(eligibleItem.productId);

      // Pre-fill start date from delivery date if available
      if (activeShipment.deliveryDate) {
        try {
          const d = new Date(activeShipment.deliveryDate);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const startStr = `${y}-${m}-${day}`;
            setStartDate(startStr);

            const dEnd = new Date(d);
            dEnd.setFullYear(dEnd.getFullYear() + 1);
            const endY = dEnd.getFullYear();
            const endM = String(dEnd.getMonth() + 1).padStart(2, "0");
            const endDay = String(dEnd.getDate()).padStart(2, "0");
            setEndDate(`${endY}-${endM}-${endDay}`);
          }
        } catch {
          // Keep current dates
        }
      }
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
      queryClient.invalidateQueries({ queryKey: ["eligible-shipments-for-warranty"] });
      queryClient.invalidateQueries({ queryKey: ["next-serial-number"] });
      refetchShipments();
      refetchSerial();
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
      refetchSerial();
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
      setErrorMessage("Please select a product from the delivered shipment.");
      return;
    }
    if (isLoadingSerial) {
      setErrorMessage("Please wait while the serial number is being allocated.");
      return;
    }
    if (!serialNumber.trim()) {
      setErrorMessage("Serial number could not be allocated. Please re-select the product.");
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
              Delivered Shipment <span className="text-rose-500">*</span>
            </Label>
            {isLoadingShipments ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading delivered shipments...
              </div>
            ) : deliveredShipments.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300 text-xs">
                No delivered shipments found eligible for warranty registration.
              </div>
            ) : (
              <Select value={selectedShipmentId} onValueChange={setSelectedShipmentId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select delivered shipment..." />
                </SelectTrigger>
                <SelectContent>
                  {deliveredShipments.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.trackingNumber} {s.orderNumber ? `(${s.orderNumber})` : ""} — {s.courierName || "Delivered"}
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
              Product <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
              disabled={!activeShipment || !activeShipment.items || activeShipment.items.length === 0}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue
                  placeholder={
                    isLoadingShipments
                      ? "Loading products..."
                      : activeShipment?.items?.length
                      ? "Select product..."
                      : "No products available for selected shipment"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {activeShipment?.items?.map((item) => (
                  <SelectItem key={item.id} value={item.productId} className="text-xs">
                    {item.productName} ({item.productCode || item.sku || item.productId.substring(0, 8)}) — Qty: {item.quantity}
                    {item.remainingEligibleQuantity !== undefined
                      ? item.remainingEligibleQuantity > 0
                        ? ` (${item.remainingEligibleQuantity} eligible)`
                        : " (Fully registered)"
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serial Number (Auto-Incremented & Read-Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Serial Number <span className="text-rose-500">*</span>
              </Label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Auto-Incremented
              </span>
            </div>
            <div className="relative">
              <Input
                value={serialNumber}
                readOnly
                disabled={isLoadingSerial}
                placeholder={
                  isLoadingSerial
                    ? "Allocating serial number..."
                    : selectedProductId
                    ? "Generating sequence..."
                    : "Select a product above"
                }
                className="h-9 text-xs font-mono font-semibold bg-slate-50 dark:bg-slate-900/60 cursor-not-allowed select-none text-slate-800 dark:text-slate-200"
                required
              />
              {isLoadingSerial && (
                <div className="absolute right-2.5 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Unique sequential serial number generated automatically from product code. Read-only.
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
              disabled={
                registerMutation.isPending ||
                deliveredShipments.length === 0 ||
                !selectedShipmentId ||
                !selectedProductId ||
                isLoadingSerial ||
                !serialNumber ||
                Boolean(serialError)
              }
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
