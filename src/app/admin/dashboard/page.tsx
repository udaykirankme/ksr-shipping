import { Package, Truck, TrendingUp } from "lucide-react";
import { CircularKpi } from "@/components/dashboard/circular-kpi";
import { ShipmentOverview } from "@/components/dashboard/shipment-overview";
import { RecentShipments } from "@/components/dashboard/recent-shipments";
import { RecentNotifications } from "@/components/dashboard/recent-notifications";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { serverApiFetch } from "@/lib/server-api";

export const metadata = {
  title: "Dashboard | KSR Shipping Services Admin",
};

async function getDashboardStats() {
  return serverApiFetch<{
    createdShipments: number;
    deliveredShipments: number;
    monthlyRevenue: number;
    monthlyProfit: number;
    recentShipments: unknown[];
    statusCounts?: Record<string, number>;
  }>('/api/admin/dashboard-stats');
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = (await getDashboardStats()) || {
    createdShipments: 0,
    deliveredShipments: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
    recentShipments: []
  };

  const formatRupee = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* KPI Widgets Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
        <CircularKpi 
          title="Shipments Created" 
          value={stats.createdShipments?.toString() || "0"} 
          subtitle="New shipments this month"
          icon={Package} 
          progress={100}
          colorClass="text-blue-500"
        />
        <CircularKpi 
          title="Delivered" 
          value={stats.deliveredShipments?.toString() || "0"} 
          subtitle="Completed shipments this month"
          icon={Truck} 
          progress={100}
          colorClass="text-orange-500"
        />
        <CircularKpi 
          title="Profit This Month" 
          value={formatRupee(stats.monthlyProfit || 0)} 
          subtitle="Total profit booked"
          icon={TrendingUp} 
          progress={100}
          colorClass="text-emerald-500"
        />
      </div>

      {/* Main Charts / Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ShipmentOverview statusCounts={stats.statusCounts} />
        </div>
        <div className="lg:col-span-1">
          <RecentNotifications />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Shipments Table */}
      <RecentShipments initialData={stats.recentShipments} />
      
    </div>
  );
}
