import { useState, useEffect, useCallback } from "react";
import { User, Shield, Lock, Activity, Users, Link2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { userApi } from "@/api/user.api";
import { usePermissions } from "@/hooks/use-permissions";
import type { User as UserType } from "@/types";

import { ProfileOverview } from "./components/ProfileOverview";
import { PersonalInfoTab } from "./components/PersonalInfoTab";
import { SecurityTab } from "./components/SecurityTab";
import { PreferencesTab } from "./components/PreferencesTab";
import { MyPermissionsTab } from "./components/MyPermissionsTab";
import { ActivityTab } from "./components/ActivityTab";
import { SuperAdminStats } from "./components/SuperAdminStats";
import { ConnectedAccountsTab } from "./components/ConnectedAccountsTab";
import { LoadingView } from "@/components/ui/state-views";

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  
  const [fullUser, setFullUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  // Determine if the user is a super admin by checking for administrative permission.
  const isSuperAdmin = hasPermission("Permissions.Users.View");

  const loadUserData = useCallback(async () => {
    if (!currentUser?.userId) return;
    
    setIsLoading(true);
    try {
      if (hasPermission("Permissions.Users.View")) {
        const data = await userApi.getById(currentUser.userId);
        setFullUser(data);
      } else {
        setFullUser({
          id: currentUser.userId,
          firstName: "",
          lastName: "",
          email: currentUser.email,
          phone: "",
          companyId: currentUser.companyId || "",
          roleIds: [],
          isActive: true,
        });
      }
    } catch (err: any) {
      setFullUser({
        id: currentUser.userId,
        firstName: "",
        lastName: "",
        email: currentUser.email,
        phone: "",
        companyId: currentUser.companyId || "",
        roleIds: [],
        isActive: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, hasPermission]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Overview Section */}
      <ProfileOverview currentUser={currentUser} fullUser={fullUser} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-2 sticky top-6">
            <nav className="flex flex-col space-y-1">
              <button
                onClick={() => setActiveTab("personal")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "personal"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <User className="w-4 h-4" />
                Personal Information
              </button>
              
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "security"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Lock className="w-4 h-4" />
                Security Settings
              </button>
              
              <button
                onClick={() => setActiveTab("preferences")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "preferences"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <SettingsIcon />
                Preferences
              </button>
              
              <button
                onClick={() => setActiveTab("permissions")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "permissions"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Shield className="w-4 h-4" />
                My Permissions
              </button>
              
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "activity"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Activity className="w-4 h-4" />
                My Activity
              </button>

              {/* Connected Accounts — visible to all users for self-service Google linking */}
              <button
                onClick={() => setActiveTab("connected")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "connected"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Link2 className="w-4 h-4" />
                Connected Accounts
              </button>
              
              {isSuperAdmin && (
                <>
                  <div className="my-2 border-t border-slate-100" />
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "admin"
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Administration
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {isLoading && !fullUser ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-12 flex justify-center">
              <LoadingView title="Loading Profile..." />
            </div>
          ) : (
            <>
              {activeTab === "personal" && fullUser && (
                <PersonalInfoTab user={fullUser} onUpdate={loadUserData} />
              )}
              {activeTab === "security" && (
                <SecurityTab />
              )}
              {activeTab === "preferences" && (
                <PreferencesTab />
              )}
              {activeTab === "permissions" && (
                <MyPermissionsTab user={currentUser} />
              )}
              {activeTab === "activity" && (
                <ActivityTab />
              )}
              {activeTab === "connected" && (
                <ConnectedAccountsTab />
              )}
              {activeTab === "admin" && isSuperAdmin && (
                <SuperAdminStats />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline Icon component for Preferences
function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
