import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Plus, ArrowLeft } from "lucide-react";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { warehousesApi, warehouseLocationsApi, WarehouseDto, WarehouseLocationDto } from "@/api";
import { ROUTES } from "@/routes";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";

export function WarehouseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [warehouse, setWarehouse] = useState<WarehouseDto | null>(null);
  const [locations, setLocations] = useState<WarehouseLocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [warehouseData, locationsData] = await Promise.all([
        warehousesApi.getById(id!),
        warehouseLocationsApi.getByWarehouse(id!)
      ]);
      setWarehouse(warehouseData);
      setLocations(locationsData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch warehouse details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView title="Loading Warehouse Details..." />;
  if (error) return <ErrorView message={error} onRetry={fetchData} />;
  if (!warehouse) return null;

  return (
    <PageContainer>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.INVENTORY_WAREHOUSES)} className="rounded-full hover:bg-slate-100 text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={warehouse.warehouseName}
          description={`Code: ${warehouse.warehouseCode}`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mt-4">
        <SectionCard className="md:col-span-1 border border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Warehouse Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Status</span>
              {warehouse.isActive ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">Active</span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Inactive</span>
              )}
              {warehouse.isDefault && <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">Default Warehouse</span>}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Manager</span>
              <p className="text-slate-800 font-medium">{warehouse.managerName || "Not assigned"}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Address</span>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                <p>{warehouse.address || "No address provided"}</p>
              </div>
            </div>
          </CardContent>
        </SectionCard>

        <SectionCard className="md:col-span-2 overflow-hidden border border-slate-200/60 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">Storage Locations</CardTitle>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2">
              <Plus className="h-4 w-4" /> Add Location
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-700">Code</TableHead>
                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Zone/Rack</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        No storage locations defined for this warehouse.
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((loc) => (
                      <TableRow key={loc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium text-slate-900">{loc.locationCode}</TableCell>
                        <TableCell className="text-slate-800">{loc.locationName}</TableCell>
                        <TableCell className="text-slate-600">
                          {loc.zone ? `Zone: ${loc.zone}` : ''} {loc.rack ? `/ Rack: ${loc.rack}` : ''}
                          {!loc.zone && !loc.rack && '-'}
                        </TableCell>
                        <TableCell>
                          {loc.isActive ? (
                            <span className="text-xs font-medium text-emerald-600">Active</span>
                          ) : (
                            <span className="text-xs font-medium text-slate-500">Inactive</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
