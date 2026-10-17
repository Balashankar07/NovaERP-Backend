import { useState, useRef, useEffect } from "react";
import { FileText, Plus, Edit2, Trash2, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";

export function ActivityTimeline() {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "audit-report"],
    queryFn: () => dashboardApi.getAuditReport({ pageSize: 20 }),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const data = response?.items || [];
  const status = isLoading ? "loading" : isError ? "error" : data.length === 0 ? "empty" : "success";

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setCanScrollUp(scrollTop > 10);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [data]);

  const scrollDown = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: 160, behavior: "smooth" });
    }
  };

  const scrollUp = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: -160, behavior: "smooth" });
    }
  };

  const getActivityIconAndColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("add")) {
      return { icon: Plus, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" };
    }
    if (act.includes("update") || act.includes("edit")) {
      return { icon: Edit2, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" };
    }
    if (act.includes("delete") || act.includes("remove")) {
      return { icon: Trash2, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" };
    }
    return { icon: FileText, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800" };
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6 flex flex-col h-[440px] relative overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight">Recent Enterprise Activity</h3>
          {data.length > 0 && (
            <span className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {data.length}
            </span>
          )}
        </div>

        {/* Scroll Controls in Header */}
        <div className="flex items-center gap-1.5">
          {canScrollUp && (
            <button
              onClick={scrollUp}
              title="Scroll Up"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
          {canScrollDown && (
            <button
              onClick={scrollDown}
              title="Scroll Down"
              className="p-1 rounded-md text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1 text-xs px-2 py-1 font-medium"
            >
              <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
              <span>Scroll</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 min-h-0">
        {status === "loading" && (
          <div className="w-full h-full bg-slate-50 dark:bg-slate-800/40 animate-pulse rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <div className="h-8 w-8 text-slate-300 animate-spin border-4 border-slate-300 border-t-slate-400 rounded-full" />
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center h-full text-rose-500">
            <AlertCircle className="h-10 w-10 mb-2 opacity-80" />
            <p className="font-medium text-sm">Failed to load Recent Activity</p>
          </div>
        )}

        {status === "empty" && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
            <Clock className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium text-sm">No recent activity</p>
          </div>
        )}

        {status === "success" && data && (
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="h-full overflow-y-auto pr-3 relative pl-3 space-y-6 scrollbar-thin 
                       [&&::-webkit-scrollbar]:w-2 
                       [&&::-webkit-scrollbar-track]:bg-muted/30 
                       [&&::-webkit-scrollbar-track]:rounded-full 
                       [&&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 
                       [&&::-webkit-scrollbar-thumb]:rounded-full 
                       hover:[&&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 transition-colors"
          >
            {/* Vertical timeline line */}
            <div className="absolute top-2 bottom-2 left-[27px] w-[2px] bg-slate-200 dark:bg-slate-800 pointer-events-none"></div>

            {data.map((activity) => {
              const { icon: Icon, color, bg } = getActivityIconAndColor(activity.action);
              
              return (
                <div key={activity.id} className="relative flex items-start gap-4 group/item">
                  <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} border border-card ring-4 ring-card transition-transform group-hover/item:scale-110`}>
                    <Icon className={`h-4 w-4 ${color}`} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col flex-1 pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                        {activity.action} {activity.entityName}
                      </p>
                      <span className="text-[12px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatTime(activity.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {activity.entityName}
                      </span>
                      {activity.userName && (
                        <span className="text-[12px] text-slate-500 dark:text-slate-400">by {activity.userName}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Quick Scroll Down Button at bottom right */}
        {status === "success" && canScrollDown && (
          <button
            onClick={scrollDown}
            className="absolute bottom-2 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full 
                       bg-primary text-primary-foreground text-xs font-medium shadow-md 
                       hover:bg-primary/90 hover:shadow-lg transition-all duration-200 animate-pulse hover:animate-none cursor-pointer"
            title="Click to scroll down"
          >
            <span>Scroll Down</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

