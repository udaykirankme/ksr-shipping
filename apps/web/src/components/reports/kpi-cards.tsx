"use client";

import Link from "next/link";
import { Package, FileText, MessageSquare, IndianRupee, TrendingUp, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  data: any;
  loading: boolean;
}

export function KpiCards({ data, loading }: KpiCardsProps) {
  const formatRupee = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const cards = [
    {
      title: "Total Shipments",
      value: data?.shipments?.total || 0,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-50",
      link: "/admin/dashboard/shipments"
    },
    {
      title: "Total Revenue",
      value: formatRupee(data?.shipments?.revenue),
      icon: IndianRupee,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      link: "/admin/dashboard/shipments"
    },
    {
      title: "Total Profit",
      value: formatRupee(data?.shipments?.profit),
      icon: TrendingUp,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      link: "/admin/dashboard/shipments"
    },
    {
      title: "Total Quotes",
      value: data?.quotes?.total || 0,
      icon: FileText,
      color: "text-orange-500",
      bg: "bg-orange-50",
      link: "/admin/dashboard/quotations"
    },
    {
      title: "Total Messages",
      value: data?.contacts?.total || 0,
      icon: MessageSquare,
      color: "text-purple-500",
      bg: "bg-purple-50",
      link: "/admin/dashboard/messages"
    },
    {
      title: "Unread Notifications",
      value: data?.notifications?.unread || 0,
      icon: Bell,
      color: "text-red-500",
      bg: "bg-red-50",
      link: "/admin/dashboard/notifications"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Link href={card.link} key={i}>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", card.bg, card.color)}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
