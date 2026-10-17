import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Truck } from "lucide-react";
import { shipmentsApi } from "@/api/shipments.api";
import { ShipmentDto, ShipmentStatus } from "@/types/shipments.types";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/utils/formatters";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PermissionButton } from "@/components/common/permission-button";
import { LoadingView, ErrorView } from "@/components/ui/state-views";

export function ShipmentsListPage() {
  const [shipments, setShipments] = useState<ShipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { hasPermission } = usePermissions();

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await shipmentsApi.getAll({ search: searchTerm });
      setShipments(res.items);
    } catch (err: any) {
      setError(err.message || "Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.Pending: return <Badge variant="outline" className="bg-amber-100 text-amber-700">Pending</Badge>;
      case ShipmentStatus.Dispatched: return <Badge variant="outline" className="bg-blue-100 text-blue-700">Dispatched</Badge>;
      case ShipmentStatus.Delivered: return <Badge variant="outline" className="bg-emerald-100 text-emerald-700">Delivered</Badge>;
      case ShipmentStatus.Cancelled: return <Badge variant="outline" className="bg-rose-100 text-rose-700">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && shipments.length === 0) return <LoadingView />;
  if (error) return <ErrorView title="Error" message={error} onRetry={loadShipments} />;

  return (
    <PageContainer>
      <PageHeader
        title="Shipments"
        description="Manage distribution and outbound shipments."
        actions={
          <div className="flex gap-2">
            {/* Shipment is created via Sales Order page normally */}
          </div>
        }
      />

      <SectionCard>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search tracking or courier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadShipments()}
            />
          </div>
          <Button variant="outline" onClick={loadShipments}>Search</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking Number</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dispatch Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell className="font-mono">{shipment.trackingNumber}</TableCell>
                <TableCell>{shipment.courierName}</TableCell>
                <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                <TableCell>{shipment.dispatchDate ? formatDate(shipment.dispatchDate) : "-"}</TableCell>
                <TableCell>{shipment.deliveryDate ? formatDate(shipment.deliveryDate) : "-"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <PermissionButton
                    permission="Permissions.Shipments.View"
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/distribution/shipments/${shipment.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Link>
                  </PermissionButton>
                </TableCell>
              </TableRow>
            ))}
            {shipments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No shipments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </PageContainer>
  );
}
