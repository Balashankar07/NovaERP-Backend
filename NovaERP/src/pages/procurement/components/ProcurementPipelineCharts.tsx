import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FileText, ShoppingCart } from "lucide-react";
import { ProcurementSummaryDto } from "@/api/procurement.api";

interface ProcurementPipelineChartsProps {
  summary: ProcurementSummaryDto;
}

export function ProcurementPipelineCharts({ summary }: ProcurementPipelineChartsProps) {
  
  // Transform PR Pipeline Dictionary into Chart Data
  const prChartData = useMemo(() => {
    if (!summary?.prPipeline) return [];
    
    // Explicitly define order and labels based on known states
    const stages = [
      { key: "Draft", label: "Draft", color: "#94a3b8" }, // slate-400
      { key: "PendingApproval", label: "Pending", color: "#f59e0b" }, // amber-500
      { key: "Approved", label: "Approved", color: "#10b981" }, // emerald-500
      { key: "Rejected", label: "Rejected", color: "#f43f5e" }, // rose-500
      { key: "Converted", label: "Converted", color: "#3b82f6" } // blue-500
    ];

    return stages.map(stage => ({
      name: stage.label,
      count: summary.prPipeline[stage.key] || 0,
      color: stage.color
    }));
  }, [summary]);

  // Transform PO Pipeline Dictionary into Chart Data
  const poChartData = useMemo(() => {
    if (!summary?.poPipeline) return [];
    
    // Explicitly define order and labels based on known states
    const stages = [
      { key: "Draft", label: "Draft", color: "#94a3b8" }, // slate-400
      { key: "Approved", label: "Approved", color: "#6366f1" }, // indigo-500
      { key: "Sent", label: "Sent", color: "#f59e0b" }, // amber-500
      { key: "PartiallyReceived", label: "Partial GRN", color: "#a855f7" }, // purple-500
      { key: "Closed", label: "Closed", color: "#10b981" } // emerald-500
    ];

    return stages.map(stage => ({
      name: stage.label,
      count: summary.poPipeline[stage.key] || 0,
      color: stage.color
    }));
  }, [summary]);

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-6">
      {/* PR Pipeline Chart */}
      <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
        <CardHeader className="pb-3 pt-4 px-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" /> Purchase Request Pipeline
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">Distribution of requests by workflow stage</CardDescription>
        </CardHeader>
        <CardContent className="p-4 h-[250px]">
          {prChartData.every(d => d.count === 0) ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
              No purchase request data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '11px', color: '#475569' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {prChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* PO Pipeline Chart */}
      <Card className="bg-white border-slate-200/80 shadow-sm rounded-xl">
        <CardHeader className="pb-3 pt-4 px-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" /> Purchase Order Pipeline
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">Distribution of orders by execution stage</CardDescription>
        </CardHeader>
        <CardContent className="p-4 h-[250px]">
          {poChartData.every(d => d.count === 0) ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
              No purchase order data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={poChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '11px', color: '#475569' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {poChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
