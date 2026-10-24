import { useState } from "react";
import { Sparkles, Moon, Sun, Settings, User, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AIAssistantDrawer } from "./AIAssistantDrawer";

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const getInitials = (email?: string) => {
    if (!email) return "SA";
    const namePart = email.split("@")[0];
    return namePart.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (email?: string) => {
    if (!email) return "Super Admin";
    const namePart = email.split("@")[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-[64px] w-full items-center justify-between border-b border-border/40 bg-card/80 backdrop-blur-xl backdrop-saturate-150 text-card-foreground px-6 transition-all duration-300 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      
      {/* Left section: Enterprise Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/40 text-xs text-muted-foreground font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">NovaERP</span>
          <span className="opacity-40">/</span>
          <span>Enterprise HQ</span>
        </div>
      </div>

      {/* Right section: Actions & User Avatar */}
      <div className="flex items-center gap-2.5">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsAssistantOpen(true)}
          className="hidden lg:flex h-9 gap-2 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition-all font-medium text-xs shadow-xs rounded-lg"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" strokeWidth={2} />
          <span>Ask AI Assistant</span>
        </Button>

        <div className="h-4 w-[1px] bg-border/60 mx-1 hidden lg:block" />

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          title="Toggle Color Theme"
          className="relative h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-transform active:scale-95"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px] text-amber-400 transition-transform rotate-0 hover:rotate-45" strokeWidth={2} />
          ) : (
            <Moon className="h-[18px] w-[18px] text-slate-700 transition-transform rotate-0 hover:-rotate-12" strokeWidth={2} />
          )}
        </Button>

        <NotificationBell />

        <div className="h-4 w-[1px] bg-border/60 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-3 gap-2 hover:bg-accent border border-border/40 transition-all">
              <Avatar className="h-7 w-7 border border-primary/20 shadow-xs">
                <AvatarImage src="" alt={getDisplayName(user?.email)} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-left leading-none">
                <span className="text-xs font-semibold text-foreground">{getDisplayName(user?.email)}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">{user?.role || "Super Admin"}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60 p-1.5 shadow-xl border-border/60 rounded-xl" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-2.5 rounded-lg bg-muted/40 mb-1">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold text-foreground leading-none">{getDisplayName(user?.email)}</p>
                <p className="text-[11px] leading-none text-muted-foreground mt-1">
                  {user?.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold w-fit">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {user?.role || "Super Admin"}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-border/50" />
            <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} className="text-xs text-foreground cursor-pointer rounded-md focus:bg-accent p-2">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} className="text-xs text-foreground cursor-pointer rounded-md focus:bg-accent p-2">
              <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border/50" />
            <DropdownMenuItem onClick={logout} className="text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md p-2">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AIAssistantDrawer open={isAssistantOpen} onOpenChange={setIsAssistantOpen} />
    </header>
  );
}
