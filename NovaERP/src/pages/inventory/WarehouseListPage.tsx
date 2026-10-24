import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MapPin } from "lucide-react";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { warehousesApi, WarehouseDto, CreateWarehouseDto } from "@/api";
import { ROUTES } from "@/routes";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function WarehouseListPage() {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateWarehouseDto>({
    warehouseCode: "",
    warehouseName: "",
    address: "",
    managerName: "",
    isDefault: false,
    isActive: true,
  });

  const handleOpenCreate = () => {
    setFormData({
      warehouseCode: "",
      warehouseName: "",
      address: "",
      managerName: "",
      isDefault: false,
      isActive: true,
    });
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.warehouseCode.trim() || !formData.warehouseName.trim()) {
      toast.error("Warehouse Code and Name are required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await warehousesApi.create({
        ...formData,
        warehouseCode: formData.warehouseCode.trim(),
        warehouseName: formData.warehouseName.trim(),
        address: formData.address?.trim() || "",
        managerName: formData.managerName?.trim() || "",
      });
      toast.success("Warehouse created successfully");
      setIsCreateOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      toast.error(err.message || "Failed to create warehouse");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [page, search]);

  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await warehousesApi.getAll({ pageNumber: page, pageSize: 15, search });
      setWarehouses(data.items);
      setTotalPages(Math.ceil(data.totalCount / data.pageSize));
    } catch (err: any) {
      setError(err.message || "Failed to fetch warehouses.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading && warehouses.length === 0) return <LoadingView title="Loading Warehouses..." />;
    if (error) return <ErrorView message={error} onRetry={fetchWarehouses} />;

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search warehouses..."
              className="pl-9 bg-white border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Button variant="default" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" /> Add Warehouse
          </Button>
        </div>

        <SectionCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-700">Code</TableHead>
                  <TableHead className="font-semibold text-slate-700">Warehouse Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Location Details</TableHead>
                  <TableHead className="font-semibold text-slate-700">Manager</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No warehouses found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouses.map((w) => (
                    <TableRow key={w.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-indigo-600">
                        <Link to={`/inventory/warehouses/${w.id}`} className="hover:underline transition-colors">
                          {w.warehouseCode}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/inventory/warehouses/${w.id}`} className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                          {w.warehouseName}
                        </Link>
                        {w.isDefault && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">Default</span>}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {w.address || "No address"}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{w.managerName || "-"}</TableCell>
                      <TableCell>
                        {w.isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">Active</span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Inactive</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Warehouses"
        description="Manage storage facilities and warehouse locations."
      />
      {renderContent()}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Warehouse</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="warehouseCode" className="after:content-['*'] after:ml-0.5 after:text-red-500">Warehouse Code</Label>
              <Input
                id="warehouseCode"
                value={formData.warehouseCode}
                onChange={(e) => setFormData({ ...formData, warehouseCode: e.target.value })}
                placeholder="e.g. WH-MAIN"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="warehouseName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Warehouse Name</Label>
              <Input
                id="warehouseName"
                value={formData.warehouseName}
                onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                placeholder="e.g. Main Warehouse"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Location Details</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address or location details"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="managerName">Manager Name</Label>
              <Input
                id="managerName"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="Warehouse manager"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked as boolean })}
              />
              <Label htmlFor="isDefault" className="cursor-pointer font-normal">Set as default warehouse</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
              />
              <Label htmlFor="isActive" className="cursor-pointer font-normal">Active</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? "Creating..." : "Create Warehouse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
