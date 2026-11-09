import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FilePlus2, Box, Truck, MapPin, CheckCircle, ArrowRight } from "lucide-react";

interface ShipmentOverviewProps {
  stageCounts?: Record<number, number>;
  statusCounts?: Record<string, number>;
}

export function ShipmentOverview({ stageCounts = {}, statusCounts = {} }: ShipmentOverviewProps) {
  // Exactly 5 main shipment stages matching the public tracking progress tracker milestone logic:
  // Stage 0: Shipment Created
  // Stage 1: Shipped
  // Stage 2: In Transit
  // Stage 3: Out for Delivery
  // Stage 4: Delivered
  const data = [
    {
      stage: 0,
      label: "Shipment Created",
      actionText: "See Shipments",
      value: stageCounts[0] ?? (statusCounts["Shipment Created"] || 0),
      icon: FilePlus2,
      color: "text-blue-500",
      bg: "bg-blue-100",
      href: "/admin/dashboard/shipments?stage=0",
    },
    {
      stage: 1,
      label: "Shipped",
      actionText: "See Shipments",
      value: stageCounts[1] ?? (statusCounts["Picked Up"] || 0),
      icon: Box,
      color: "text-amber-500",
      bg: "bg-amber-100",
      href: "/admin/dashboard/shipments?stage=1",
    },
    {
      stage: 2,
      label: "In Transit",
      actionText: "Track Shipments",
      value: stageCounts[2] ?? (statusCounts["In Transit"] || 0),
      icon: Truck,
      color: "text-orange-500",
      bg: "bg-orange-100",
      href: "/admin/dashboard/shipments?stage=2",
    },
    {
      stage: 3,
      label: "Out for Delivery",
      actionText: "View Shipments",
      value: stageCounts[3] ?? (statusCounts["Out For Delivery"] || 0),
      icon: MapPin,
      color: "text-indigo-500",
      bg: "bg-indigo-100",
      href: "/admin/dashboard/shipments?stage=3",
    },
    {
      stage: 4,
      label: "Delivered",
      actionText: "View Delivered",
      value: stageCounts[4] ?? (statusCounts["Delivered"] || 0),
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-100",
      href: "/admin/dashboard/shipments?stage=4",
    },
  ];

  return (
    <Card className="h-full overflow-hidden border border-orange-100/50 shadow-[0_4px_20px_rgba(255,106,0,0.05)] hover:shadow-[0_4px_25px_rgba(255,106,0,0.15)] transition-all duration-300 bg-white">
      <CardHeader className="pb-6 border-b border-gray-100/50">
        <CardTitle className="text-lg">Shipment Status Overview</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Active shipments by milestone stage</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 divide-x divide-gray-100">
          {data.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-orange-50/50 group cursor-pointer focus:outline-hidden hover:shadow-inner relative"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5 transition-transform group-hover:scale-110 shadow-2xs",
                  item.bg,
                  item.color
                )}
              >
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{item.value}</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">
                {item.label}
              </span>
              <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600/80 group-hover:text-orange-600 transition-all">
                <span>{item.actionText}</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
