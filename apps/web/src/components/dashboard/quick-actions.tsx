import Link from "next/link";
import { Plus, Package, FileText, MessageSquare, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function QuickActions() {
  const actions = [
    { name: "Create Shipment", icon: Plus, href: "/admin/dashboard/shipments/new", color: "bg-orange-100 text-orange-600 border-orange-200 hover:bg-orange-600 hover:text-white" },
    { name: "View Shipments", icon: Package, href: "/admin/dashboard/shipments", color: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-700 hover:text-white" },
    { name: "Quote Requests", icon: FileText, href: "/admin/dashboard/quotations", color: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-700 hover:text-white" },
    { name: "Contact Messages", icon: MessageSquare, href: "/admin/dashboard/messages", color: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-700 hover:text-white" },
    { name: "Reports", icon: BarChart3, href: "/admin/dashboard/reports", color: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-700 hover:text-white" },
  ];

  return (
    <Card className="rounded-2xl border border-orange-100/50 shadow-[0_4px_20px_rgba(255,106,0,0.05)] hover:shadow-[0_4px_25px_rgba(255,106,0,0.15)] transition-all duration-300 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {actions.map((action) => (
            <Link 
              key={action.name} 
              href={action.href}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${action.color} group`}
            >
              <action.icon className="w-6 h-6 mb-2 transition-transform group-hover:scale-110" />
              <span className="text-xs font-semibold text-center">{action.name}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
