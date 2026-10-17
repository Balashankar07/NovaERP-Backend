import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background antialiased font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <ScrollArea className="flex-1 min-h-0 bg-gradient-to-b from-background via-background to-muted/20">
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 w-full">
            <Outlet />
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
