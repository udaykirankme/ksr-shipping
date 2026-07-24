"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportsService, ReportFilters } from "@/lib/reports-service";
import { DateFilter } from "@/components/dashboard/date-filter";
import { KpiCards } from "@/components/reports/kpi-cards";

export function ReportsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [dateFilter, setDateFilter] = useState("this-month");
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ReportFilters = { dateFilter };
      const analyticsData = await reportsService.getAnalytics(filters);
      setData(analyticsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Analyze business performance, shipment trends, and conversion rates
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <Button variant="outline" onClick={fetchData} disabled={loading} className="shrink-0 bg-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards data={data} loading={loading} />
    </div>
  );
}
