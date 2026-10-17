import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supplierPerformanceApi } from '@/api/supplierPerformance.api';
import { SupplierPerformanceSummary } from '@/types/supplierPerformance.types';
import { PageHeader } from '@/components/ui/page-shell';
import { LoadingView, ErrorView } from '@/components/ui/state-views';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Building2, Eye, Award, Clock, PackageCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupplierPerformanceListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const { data: summaries = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['supplier-performance-summaries'],
    queryFn: () => supplierPerformanceApi.getAllSummaries(),
  });

  const filtered = summaries.filter(s => {
    const matchesSearch = 
      s.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplierCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGrade = 
      gradeFilter === 'ALL' || 
      (gradeFilter === 'A' && s.grade.startsWith('Grade A')) ||
      (gradeFilter === 'B' && s.grade.startsWith('Grade B')) ||
      (gradeFilter === 'C' && s.grade.startsWith('Grade C')) ||
      (gradeFilter === 'D' && s.grade.startsWith('Grade D')) ||
      (gradeFilter === 'INSUFFICIENT' && s.grade === 'INSUFFICIENT DATA');

    return matchesSearch && matchesGrade;
  });

  if (isLoading) return <LoadingView title="Loading Supplier Performance Records..." />;
  if (isError) return <ErrorView title="Failed to load supplier performance records" onRetry={refetch} />;

  const getGradeBadge = (grade: string) => {
    if (grade.startsWith('Grade A')) return <Badge className="bg-emerald-600 text-white font-semibold">Grade A</Badge>;
    if (grade.startsWith('Grade B')) return <Badge className="bg-blue-600 text-white font-semibold">Grade B</Badge>;
    if (grade.startsWith('Grade C')) return <Badge className="bg-amber-600 text-white font-semibold">Grade C</Badge>;
    if (grade.startsWith('Grade D')) return <Badge className="bg-rose-600 text-white font-semibold">Grade D</Badge>;
    return <Badge variant="outline" className="text-slate-500 border-slate-300">INSUFFICIENT DATA</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Vendor Performance Summaries & Directory"
        description="Comprehensive evaluation list of active suppliers calculated dynamically from real PO and Goods Receipt histories."
        actions={
          <Button asChild variant="outline">
            <Link to="/suppliers">
              <Building2 className="h-4 w-4 mr-1.5" /> Supplier Master Catalog
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <Input
              placeholder="Search by Code, Vendor Name, or Contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Grade Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Grades</SelectItem>
                <SelectItem value="A">Grade A (Excellent)</SelectItem>
                <SelectItem value="B">Grade B (Good)</SelectItem>
                <SelectItem value="C">Grade C (Satisfactory)</SelectItem>
                <SelectItem value="D">Grade D (Needs Attention)</SelectItem>
                <SelectItem value="INSUFFICIENT">Insufficient Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3">Code / Vendor</th>
                  <th className="px-6 py-3">POs / GRNs</th>
                  <th className="px-6 py-3">Total Spend</th>
                  <th className="px-6 py-3">On-Time %</th>
                  <th className="px-6 py-3">Fill Rate %</th>
                  <th className="px-6 py-3">Quality %</th>
                  <th className="px-6 py-3">Final Score</th>
                  <th className="px-6 py-3">Grade</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      No supplier performance records match your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.supplierId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-indigo-600">
                          <Link to={`/suppliers/performance/${item.supplierId}`} className="hover:underline">
                            {item.supplierCode}
                          </Link>
                        </div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{item.supplierName}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="font-bold text-blue-700">{item.totalPOCount}</span> POs / <span className="font-bold text-indigo-700">{item.totalGRNCount}</span> GRNs
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold">
                        ${item.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        {item.onTimeDeliveryRate !== undefined && item.onTimeDeliveryRate !== null ? (
                          <span className="font-bold text-blue-700">{item.onTimeDeliveryRate.toFixed(1)}%</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.fillRate !== undefined && item.fillRate !== null ? (
                          <span className="font-bold text-emerald-700">{item.fillRate.toFixed(1)}%</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.qualityAcceptanceRate !== undefined && item.qualityAcceptanceRate !== null ? (
                          <span className="font-bold text-purple-700">{item.qualityAcceptanceRate.toFixed(1)}%</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {item.finalScore !== undefined && item.finalScore !== null ? (
                          <span className="text-base">{item.finalScore.toFixed(1)}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getGradeBadge(item.grade)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/suppliers/performance/${item.supplierId}`}>
                            <Eye className="h-4 w-4 mr-1" /> Scorecard
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
