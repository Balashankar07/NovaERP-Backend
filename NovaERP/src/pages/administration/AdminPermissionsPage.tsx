import { useState, useEffect } from "react";
import {
  Key,
  Shield,
  Check,
  Minus,
  RefreshCw,
  Search,
  Filter,
  Lock,
  Layers
} from "lucide-react";
import { adminApi } from "@/api/admin.api";
import { RolePermissionMatrix } from "@/types/admin.types";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { toast } from "@/utils/toast";
import { usePermissions } from "@/hooks/use-permissions";

export function AdminPermissionsPage() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("Permissions.Roles.Edit");

  const [matrixData, setMatrixData] = useState<RolePermissionMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"MATRIX" | "CATALOG">("MATRIX");

  const loadMatrix = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getPermissionMatrix();
      setMatrixData(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load Permission Matrix.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const handleToggle = async (roleId: string, permissionId: string, currentVal: boolean) => {
    if (!canEdit) {
      toast.error("Permission denied to edit role permissions.");
      return;
    }

    const key = `${roleId}-${permissionId}`;
    setIsUpdating(key);
    const newGranted = !currentVal;

    // Optimistic UI update
    setMatrixData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        rows: prev.rows.map((row) => {
          if (row.permissionId === permissionId) {
            return {
              ...row,
              roleMap: {
                ...row.roleMap,
                [roleId]: newGranted,
              },
            };
          }
          return row;
        }),
      };
    });

    try {
      await adminApi.togglePermission({
        roleId,
        permissionId,
        isGranted: newGranted,
      });
      toast.success(newGranted ? "Permission granted" : "Permission revoked");
    } catch (err: any) {
      toast.error("Failed to update permission mapping");
      // Revert optimistic update
      loadMatrix();
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return <LoadingView title="Loading Permission Catalog & Matrix..." />;
  }

  if (error || !matrixData) {
    return <ErrorView title="Failed to load Permissions" message={error || "Server error"} onRetry={loadMatrix} />;
  }

  const filteredRows = matrixData.rows.filter((row) => {
    const matchesSearch =
      row.permissionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.module.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = selectedModule === "ALL" || row.module === selectedModule;

    return matchesSearch && matchesModule;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Permissions & Role × Permission Matrix"
        subtitle="Manage permission claims and canonical role mappings across all NovaERP enterprise modules."
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 border border-slate-200 p-1 rounded-lg flex gap-1">
              <Button
                variant={activeTab === "MATRIX" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("MATRIX")}
                className="text-xs h-7 text-slate-700"
              >
                <Layers className="w-3.5 h-3.5 mr-1" /> Matrix View
              </Button>
              <Button
                variant={activeTab === "CATALOG" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("CATALOG")}
                className="text-xs h-7 text-slate-700"
              >
                <Key className="w-3.5 h-3.5 mr-1" /> Permission Catalog
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={loadMatrix} className="gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        }
      />

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search permissions or modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-sm text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <button
            onClick={() => setSelectedModule("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedModule === "ALL"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm"
            }`}
          >
            All Modules ({matrixData.rows.length})
          </button>
          {matrixData.modules.map((mod) => {
            const count = matrixData.rows.filter((r) => r.module === mod).length;
            return (
              <button
                key={mod}
                onClick={() => setSelectedModule(mod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedModule === mod
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm"
                }`}
              >
                {mod} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "MATRIX" ? (
        /* Role x Permission Matrix Table */
        <SectionCard title="Role × Permission Matrix" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-500 min-w-[220px]">
                    Module / Permission Name
                  </th>
                  {matrixData.roles.map((r) => (
                    <th key={r.id} className="p-3 text-center text-xs font-bold uppercase tracking-wider text-indigo-600 min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <Shield className="w-4 h-4 mb-1 text-indigo-500" />
                        <span className="text-slate-700">{r.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal lowercase">({r.userCount} users)</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.permissionId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-indigo-600">
                          {row.module}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{row.permissionName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{row.description}</p>
                    </td>

                    {matrixData.roles.map((r) => {
                      const isGranted = !!row.roleMap[r.id];
                      const key = `${r.id}-${row.permissionId}`;
                      const updating = isUpdating === key;

                      return (
                        <td key={r.id} className="p-3 text-center align-middle">
                          <button
                            disabled={!canEdit || updating}
                            onClick={() => handleToggle(r.id, row.permissionId, isGranted)}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                              isGranted
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-white text-slate-400 border border-slate-200 hover:text-slate-600 hover:bg-slate-50 shadow-sm"
                            } ${!canEdit ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
                            title={isGranted ? "Allowed (Click to revoke)" : "Not allowed (Click to grant)"}
                          >
                            {updating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                            ) : isGranted ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        /* Permission Catalog View */
        <div className="space-y-6">
          {matrixData.modules.map((modName) => {
            const modulePerms = matrixData.rows.filter((r) => r.module === modName);
            if (modulePerms.length === 0) return null;

            return (
              <SectionCard key={modName} title={`${modName} Module Permissions (${modulePerms.length})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modulePerms.map((perm) => (
                    <div key={perm.permissionId} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-semibold text-slate-900">{perm.permissionName}</span>
                        </div>
                        <p className="text-xs text-slate-500">{perm.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {Object.values(perm.roleMap).filter(Boolean).length} Roles
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
