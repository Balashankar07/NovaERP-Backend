import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseTraceabilityApi } from "@/api/warehouseTraceability.api";
import { warehousesApi } from "@/api/warehouses.api";
import { HierarchicalLocation, CreateHierarchicalLocationDto } from "@/types/warehouseTraceability.types";
import { Warehouse, Plus, Layers, FolderTree, CheckCircle2, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { LoadingView, ErrorView, EmptyState } from "@/components/ui/state-views";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";

export function WarehouseLocationsPage() {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<CreateHierarchicalLocationDto>({
    warehouseId: "",
    parentLocationId: undefined,
    type: 0, // Zone
    locationCode: "",
    locationName: "",
    description: "",
  });

  const queryClient = useQueryClient();

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses-list-dropdown"],
    queryFn: async () => {
      const res = await warehousesApi.getAll({ pageSize: 100 });
      if (res.data?.items?.length && !selectedWarehouseId) {
        setSelectedWarehouseId(res.data.items[0].id);
      }
      return res.data?.items || [];
    },
  });

  const { data: hierarchy, isLoading, isError, refetch } = useQuery({
    queryKey: ["warehouse-location-hierarchy", selectedWarehouseId],
    enabled: !!selectedWarehouseId,
    queryFn: async () => {
      const res = await warehouseTraceabilityApi.getLocationHierarchy(selectedWarehouseId);
      return res.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateHierarchicalLocationDto) => warehouseTraceabilityApi.createLocation(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-location-hierarchy"] });
      toast.success("Hierarchical location created successfully");
      setIsCreateOpen(false);
      setFormData({
        warehouseId: selectedWarehouseId,
        parentLocationId: undefined,
        type: 0,
        locationCode: "",
        locationName: "",
        description: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create location");
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.warehouseId || !formData.locationCode || !formData.locationName) {
      toast.warning("Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const renderLocationTree = (nodes: HierarchicalLocation[], depth = 0) => {
    if (!nodes.length) return null;
    return (
      <div className="space-y-2 pl-4 border-l border-slate-200 ml-2">
        {nodes.map((node) => {
          const hasChildren = node.childLocations && node.childLocations.length > 0;
          const isExpanded = expandedNodes[node.id];
          const typeColor =
            node.type === "Zone" || node.type === 0
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : node.type === "Rack" || node.type === 1
              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
              : node.type === "Shelf" || node.type === 2
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200";

          return (
            <div key={node.id} className="space-y-1">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs">
                <div className="flex items-center gap-2">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpand(node.id)}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  ) : (
                    <span className="w-6" />
                  )}

                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${typeColor}`}>
                    {node.type}
                  </span>

                  <span className="font-mono font-bold text-slate-900 text-sm">{node.locationCode}</span>
                  <span className="text-slate-600 text-sm">— {node.locationName}</span>
                </div>

                <div className="flex items-center gap-2">
                  {node.isActive && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                  <PermissionButton
                    permission="Permissions.WarehouseLocations.Create"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-indigo-600 gap-1"
                    onClick={() => {
                      setFormData({
                        warehouseId: selectedWarehouseId,
                        parentLocationId: node.id,
                        type: typeof node.type === "number" ? Math.min(node.type + 1, 3) : 3,
                        locationCode: "",
                        locationName: "",
                        description: "",
                      });
                      setIsCreateOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Sub-location
                  </PermissionButton>
                </div>
              </div>

              {hasChildren && isExpanded && renderLocationTree(node.childLocations, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Warehouse Location Hierarchy"
        description="Configure parent-child storage topography (Zone → Rack → Shelf → Bin) for strict physical stock allocation."
        actions={
          <PermissionButton
            permission="Permissions.WarehouseLocations.Create"
            onClick={() => {
              setFormData({
                warehouseId: selectedWarehouseId,
                parentLocationId: undefined,
                type: 0,
                locationCode: "",
                locationName: "",
                description: "",
              });
              setIsCreateOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Add Location
          </PermissionButton>
        }
      />

      <SectionCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-slate-500" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px]"
            >
              {warehouses?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.warehouseName} ({w.warehouseCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingView title="Loading Hierarchy..." />
        ) : isError ? (
          <ErrorView title="Failed to load locations" onRetry={() => refetch()} />
        ) : !hierarchy?.length ? (
          <EmptyState
            icon={FolderTree}
            title="No Location Hierarchy Created"
            description="Create root Zones to organize Racks, Shelves, and Bins in this warehouse."
            action={
              <PermissionButton
                permission="Permissions.WarehouseLocations.Create"
                onClick={() => setIsCreateOpen(true)}
              >
                Add Root Zone
              </PermissionButton>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-50 border rounded-lg text-xs font-semibold text-slate-600">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Hierarchical Storage Topography: Zone (Level 0) → Rack (Level 1) → Shelf (Level 2) → Bin (Level 3)</span>
            </div>
            {renderLocationTree(hierarchy)}
          </div>
        )}
      </SectionCard>

      {/* Create Location Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Hierarchical Storage Location"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <Label htmlFor="warehouse">Warehouse *</Label>
            <select
              id="warehouse"
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {warehouses?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.warehouseName} ({w.warehouseCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="locationType">Location Type *</Label>
              <select
                id="locationType"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) as any })}
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>Zone (Level 0)</option>
                <option value={1}>Rack (Level 1)</option>
                <option value={2}>Shelf (Level 2)</option>
                <option value={3}>Bin (Level 3)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="locationCode">Location Code *</Label>
              <Input
                id="locationCode"
                placeholder="e.g. ZN-A, RCK-01, BIN-104"
                value={formData.locationCode}
                onChange={(e) => setFormData({ ...formData, locationCode: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="locationName">Location Name *</Label>
            <Input
              id="locationName"
              placeholder="e.g. Raw Material Storage Bin A1"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description / Notes</Label>
            <Input
              id="description"
              placeholder="Physical storage dimensions or capacity..."
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Save Location"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
