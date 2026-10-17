import { useMemo } from "react";
import { Check, X, Shield, Lock } from "lucide-react";
import type { CurrentUser } from "@/types";

interface MyPermissionsTabProps {
  user: CurrentUser;
}

type PermissionGroup = {
  [moduleName: string]: {
    [action: string]: boolean;
  };
};

export function MyPermissionsTab({ user }: MyPermissionsTabProps) {
  const groupedPermissions = useMemo(() => {
    const groups: PermissionGroup = {};
    
    // Fallback if permissions array is empty but user is admin
    const permissionsList = user.permissions || [];
    
    permissionsList.forEach(permission => {
      // Expected format: Permissions.Module.Action (e.g., Permissions.Products.View)
      const parts = permission.split(".");
      if (parts.length >= 3 && parts[0] === "Permissions") {
        const moduleName = parts[1];
        const action = parts.slice(2).join("."); // e.g. View, Create, etc.
        
        if (!groups[moduleName]) {
          groups[moduleName] = {};
        }
        groups[moduleName][action] = true;
      }
    });

    return groups;
  }, [user.permissions]);

  const moduleNames = Object.keys(groupedPermissions).sort();

  if (moduleNames.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No Explicit Permissions Found</h3>
        <p className="text-slate-500 mt-2 max-w-md">
          Your account does not have any granular permissions assigned. 
          If you are a Super Admin, you may have implicit access to all modules.
        </p>
      </div>
    );
  }

  // Common actions to check for standard display
  const standardActions = ["View", "Create", "Update", "Delete"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 md:p-8">
      <div className="mb-8 border-b border-slate-100 pb-4 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">My Permissions</h2>
          <p className="text-sm text-slate-500 mt-1">Your authorized access rights across the system.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {moduleNames.map(moduleName => {
          const modulePerms = groupedPermissions[moduleName];
          // Get all actions for this module (standard + any custom ones)
          const allActionsForModule = Array.from(new Set([...standardActions, ...Object.keys(modulePerms)]));

          return (
            <div key={moduleName} className="rounded-xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
              <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200/80">
                <h3 className="font-semibold text-slate-800">{moduleName}</h3>
              </div>
              <div className="p-4 space-y-3">
                {allActionsForModule.map(action => {
                  const hasAccess = !!modulePerms[action];
                  return (
                    <div key={action} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">{action}</span>
                      {hasAccess ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                          <Check className="w-3.5 h-3.5" /> Yes
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium">
                          <X className="w-3.5 h-3.5" /> No
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
