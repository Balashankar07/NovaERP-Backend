import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/utils/toast";
import { useTheme } from "@/providers/theme-provider";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: "light",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    language: "en-US",
    tableDensity: "standard",
    defaultPageSize: "25",
    sidebarState: "expanded",
    notifications: true,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem("nova_user_prefs");
    if (savedPrefs) {
      try {
        setPreferences({ ...preferences, ...JSON.parse(savedPrefs) });
      } catch (e) {
        // Ignore JSON parse error
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    localStorage.setItem("nova_user_prefs", JSON.stringify(preferences));
    // Apply the theme globally using the hook
    if (theme !== preferences.theme) {
      setTheme(preferences.theme as any);
    }
    
    setIsSaving(false);
    toast.success("Preferences saved successfully.");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 md:p-8">
      <div className="mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
        <p className="text-sm text-slate-500 mt-1">Customize your UI and system settings.</p>
      </div>

      <div className="space-y-8 max-w-2xl">
        {/* Theme Settings */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <Label className="text-base font-medium text-slate-900">Theme</Label>
            <p className="text-sm text-slate-500 mt-1">Select your preferred color theme.</p>
          </div>
          <div className="w-full sm:w-48">
            <Select 
              value={preferences.theme} 
              onValueChange={(val) => setPreferences({ ...preferences, theme: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sidebar State */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <Label className="text-base font-medium text-slate-900">Sidebar State</Label>
            <p className="text-sm text-slate-500 mt-1">Default behavior for the navigation sidebar.</p>
          </div>
          <div className="w-full sm:w-48">
            <Select 
              value={preferences.sidebarState} 
              onValueChange={(val) => setPreferences({ ...preferences, sidebarState: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expanded">Expanded</SelectItem>
                <SelectItem value="collapsed">Collapsed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <Label className="text-base font-medium text-slate-900">Language</Label>
            <p className="text-sm text-slate-500 mt-1">Application display language.</p>
          </div>
          <div className="w-full sm:w-48">
            <Select 
              value={preferences.language} 
              onValueChange={(val) => setPreferences({ ...preferences, language: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Spanish (Future)</SelectItem>
                <SelectItem value="fr-FR">French (Future)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Time Zone */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <Label className="text-base font-medium text-slate-900">Time Zone</Label>
            <p className="text-sm text-slate-500 mt-1">Set your local time zone for dates and times.</p>
          </div>
          <div className="w-full sm:w-48">
            <Select 
              value={preferences.timezone} 
              onValueChange={(val) => setPreferences({ ...preferences, timezone: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Format */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <Label className="text-base font-medium text-slate-900">Date Format</Label>
            <p className="text-sm text-slate-500 mt-1">How dates should be displayed to you.</p>
          </div>
          <div className="w-full sm:w-48">
            <Select 
              value={preferences.dateFormat} 
              onValueChange={(val) => setPreferences({ ...preferences, dateFormat: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Density */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <Label className="text-base font-medium text-slate-900">Table Density</Label>
            <p className="text-sm text-slate-500 mt-1">Row spacing in data tables.</p>
          </div>
          <div className="w-full sm:w-48">
            <Select 
              value={preferences.tableDensity} 
              onValueChange={(val) => setPreferences({ ...preferences, tableDensity: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select density" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Default Page Size */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <Label className="text-base font-medium text-slate-900">Default Page Size</Label>
            <p className="text-sm text-slate-500 mt-1">Number of rows per page in tables.</p>
          </div>
          <div className="w-full sm:w-48">
            <Select 
              value={preferences.defaultPageSize} 
              onValueChange={(val) => setPreferences({ ...preferences, defaultPageSize: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 Rows</SelectItem>
                <SelectItem value="25">25 Rows</SelectItem>
                <SelectItem value="50">50 Rows</SelectItem>
                <SelectItem value="100">100 Rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <Label className="text-base font-medium text-slate-900">In-App Notifications</Label>
            <p className="text-sm text-slate-500 mt-1">Receive system alerts and updates.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              checked={preferences.notifications}
              onCheckedChange={(checked: boolean) => setPreferences({ ...preferences, notifications: checked })}
              className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              id="notifications"
            />
            <label
              htmlFor="notifications"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable notifications
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}
