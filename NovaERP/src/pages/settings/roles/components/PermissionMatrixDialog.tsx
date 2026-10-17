import { useEffect, useState, useMemo } from "react";
import { Loader2, Save, ShieldAlert, ShieldCheck } from "lucide-react";

import { Role } from "@/types";
import { permissionsApi, PermissionDto } from "@/api/permissions.api";
import { roleApi } from "@/api/role.api";
import { toast } from "@/utils/toast";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingView, ErrorView } from "@/components/ui/state-views";

interface PermissionMatrixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

export function PermissionMatrixDialog({ open, onOpenChange, role }: PermissionMatrixDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, PermissionDto[]>>({});
  const [assignedPermissionIds, setAssignedPermissionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadData();
    } else {
      setGroupedPermissions({});
      setAssignedPermissionIds(new Set());
      setError(null);
    }
  }, [open, role]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [grouped, assigned] = await Promise.all([
        permissionsApi.getGrouped(),
        permissionsApi.getByRoleId(role.id)
      ]);
      
      setGroupedPermissions(grouped);
      setAssignedPermissionIds(new Set(assigned.map(p => p.id)));
    } catch (err) {
      console.error("Failed to load permissions:", err);
      setError("Failed to load permission data from the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await permissionsApi.assignToRole(role.id, Array.from(assignedPermissionIds));
      toast.success("Permissions assigned successfully");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save permissions:", err);
      toast.error("Failed to assign permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permissionId: string, checked: boolean) => {
    const next = new Set(assignedPermissionIds);
    if (checked) {
      next.add(permissionId);
    } else {
      next.delete(permissionId);
    }
    setAssignedPermissionIds(next);
  };

  const toggleCategory = (permissions: PermissionDto[], checked: boolean) => {
    const next = new Set(assignedPermissionIds);
    permissions.forEach(p => {
      if (checked) next.add(p.id);
      else next.delete(p.id);
    });
    setAssignedPermissionIds(next);
  };

  const totalPermissionsCount = Object.values(groupedPermissions).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <Modal
      title="Role Permissions"
      description={`Manage permissions for the ${role.name} role.`}
      isOpen={open}
      onClose={() => !isSaving && onOpenChange(false)}
      className="max-w-4xl"
    >
      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center">
          <LoadingView title="Loading permission matrix..." />
        </div>
      ) : error ? (
        <div className="h-[400px] flex items-center justify-center">
          <ErrorView title="Load Failed" message={error} onRetry={loadData} />
        </div>
      ) : (
        <div className="flex flex-col h-[60vh] max-h-[600px]">
          {role.name === "Super Admin" && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <h4 className="font-medium text-amber-900">Super Admin Role</h4>
                <p className="text-sm mt-1">
                  You are editing the Super Admin role. Removing critical permissions may result in system lockout. Proceed with extreme caution.
                </p>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="space-y-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupedPermissions)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, perms]) => {
                    const allSelected = perms.every(p => assignedPermissionIds.has(p.id));
                    const someSelected = perms.some(p => assignedPermissionIds.has(p.id));
                    const isIndeterminate = someSelected && !allSelected;

                    return (
                      <div key={category} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900">{category}</h4>
                          <Checkbox
                            checked={allSelected ? true : isIndeterminate ? "indeterminate" : false}
                            onCheckedChange={(c) => toggleCategory(perms, c === true)}
                            aria-label={`Select all ${category} permissions`}
                          />
                        </div>
                        <div className="p-2 space-y-1">
                          {perms.map(p => {
                            const action = p.name.split(".").pop() || p.name;
                            return (
                              <label key={p.id} className="flex items-center space-x-3 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors">
                                <Checkbox
                                  checked={assignedPermissionIds.has(p.id)}
                                  onCheckedChange={(c) => togglePermission(p.id, c as boolean)}
                                />
                                <div className="space-y-0.5 flex-1 leading-none">
                                  <span className="text-sm font-medium text-slate-700">{action}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
            <div className="text-sm text-slate-500 font-medium">
              <span className="text-indigo-600 font-bold">{assignedPermissionIds.size}</span> of {totalPermissionsCount} selected
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

