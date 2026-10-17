import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ProductionReportDto } from "@/types/reports.types";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";
import { AlertCircle, Factory } from "lucide-react";

export function ProductionOverview() {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "production-report"],
    queryFn: () => dashboardApi.getProductionReport({ pageSize: 30 }),
  });

  const data = response?.items || [];
  const status = isLoading ? "loading" : isError ? "error" : data.length === 0 ? "empty" : "success";

  // Aggregate quantities by date
  const chartData = data.length > 0
    ? Array.from(
        data.reduce((acc, order) => {
          const date = new Date(order.startDate);
          const dateStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(date);
          
          if (!acc.has(dateStr)) {
            acc.set(dateStr, { name: dateStr, quantity: 0 });
          }
          const item = acc.get(dateStr)!;
          item.quantity += order.quantity;
          return acc;
        }, new Map<string, { name: string; quantity: number }>())
        .values()
      ).reverse()
    : [];

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6 flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Production Output</h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Total units produced over time.</p>
        </div>
        
        {status === "success" && (
          <div className="flex gap-4 text-[13px] font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              <span className="text-slate-600 dark:text-slate-300">Quantity</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 w-full h-[300px] flex items-center justify-center">
        {status === "loading" && (
          <div className="w-full h-full bg-slate-50 dark:bg-slate-800/40 animate-pulse rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center">
             <div className="h-8 w-8 text-slate-300 animate-spin border-4 border-slate-300 border-t-slate-400 rounded-full" />
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center text-rose-500 dark:text-rose-400">
            <AlertCircle className="h-10 w-10 mb-2 opacity-80" />
            <p className="font-medium text-sm">Failed to load Production Data</p>
          </div>
        )}

        {status === "empty" && (
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Factory className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium text-sm">No production data available</p>
          </div>
        )}

        {status === "success" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '13px' }}
                labelStyle={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="quantity" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

