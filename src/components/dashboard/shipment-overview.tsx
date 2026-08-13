import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FilePlus2, Box, Truck, Map, MapPin, CheckCircle, Package, Archive } from "lucide-react";

export function ShipmentOverview({ statusCounts = {} }: { statusCounts?: Record<string, number> }) {
  const data = [
    { label: "Shipment Created", value: statusCounts["Shipment Created"] || 0, icon: FilePlus2, color: "text-gray-500", bg: "bg-gray-100" },
    { label: "Picked Up", value: statusCounts["Picked Up"] || 0, icon: Box, color: "text-blue-500", bg: "bg-blue-100" },
    { label: "Shipment Bagged", value: statusCounts["Shipment Bagged"] || 0, icon: Package, color: "text-yellow-600", bg: "bg-yellow-100" },
    { label: "Shipment Received", value: statusCounts["Shipment Received"] || 0, icon: Archive, color: "text-teal-600", bg: "bg-teal-100" },
    { label: "Dispatched", value: statusCounts["Dispatched"] || 0, icon: Truck, color: "text-indigo-500", bg: "bg-indigo-100" },
    { label: "In Transit", value: statusCounts["In Transit"] || 0, icon: Map, color: "text-orange-500", bg: "bg-orange-100" },
    { label: "Out For Delivery", value: statusCounts["Out For Delivery"] || 0, icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-100" },
    { label: "Delivered", value: statusCounts["Delivered"] || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  ];

  return (
    <Card className="h-full overflow-hidden border border-orange-100/50 shadow-[0_4px_20px_rgba(255,106,0,0.05)] hover:shadow-[0_4px_25px_rgba(255,106,0,0.15)] transition-all duration-300 bg-white">
      <CardHeader className="pb-6 border-b border-gray-100/50">
        <CardTitle className="text-lg">Shipment Status Overview</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Active shipments by current status</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-gray-50">
          {data.map((item, index) => {
            const isTopRow = index < 4;
            const isLeftColumn = index % 4 === 0;
            return (
              <div 
                key={item.label} 
                className={cn(
                  "p-6 flex flex-col items-center justify-center text-center transition-colors hover:bg-gray-50/50 group cursor-default",
                  !isTopRow && "border-t border-gray-50",
                  !isLeftColumn && "border-l border-gray-50"
                )}
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", item.bg, item.color)}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-gray-900 mb-1">{item.value}</span>
                <span className="text-sm font-medium text-gray-500">{item.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
