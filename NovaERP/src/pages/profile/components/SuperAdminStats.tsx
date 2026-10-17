import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, UserX, Shield, Settings, FileText, ArrowRight } from "lucide-react";
import { userApi } from "@/api/user.api";
import { ROUTES } from "@/routes/routes";

export function SuperAdminStats() {
  const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const users = await userApi.getAll();
        const active = users.filter(u => u.isActive).length;
        setStats({
          total: users.length,
          active,
          disabled: users.length - active
        });
      } catch (error) {
        console.error("Failed to load user stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 md:p-8">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Administration Overview</h2>
        <p className="text-sm text-slate-500 mt-1">System-wide statistics and quick actions.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Users</p>
            <p className="text-2xl font-bold text-slate-900">
              {isLoading ? "-" : stats.total}
            </p>
          </div>
        </div>
        
        <div className="p-4 rounded-xl border border-slate-100 bg-emerald-50/50 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Users</p>
            <p className="text-2xl font-bold text-slate-900">
              {isLoading ? "-" : stats.active}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-100 bg-rose-50/50 flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Disabled Users</p>
            <p className="text-2xl font-bold text-slate-900">
              {isLoading ? "-" : stats.disabled}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link 
          to={ROUTES.ADMIN_USERS} 
          className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3 text-slate-700 group-hover:text-indigo-700">
            <Users className="w-5 h-5" />
            <span className="font-medium">Manage Users</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </Link>
        
        <Link 
          to={ROUTES.ADMIN_ROLES} 
          className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3 text-slate-700 group-hover:text-indigo-700">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Manage Roles</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </Link>
        
        <Link 
          to={ROUTES.ADMIN_AUDIT_LOGS} 
          className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3 text-slate-700 group-hover:text-indigo-700">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Audit Logs</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </Link>
        
        <Link 
          to={ROUTES.ADMIN_SYSTEM} 
          className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3 text-slate-700 group-hover:text-indigo-700">
            <Settings className="w-5 h-5" />
            <span className="font-medium">System Settings</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
