"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { business } from "@ksr/config";
import { authService } from "@/lib/auth-service";
import {
  LayoutDashboard,
  Package,
  FileText,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  User,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Shipments", href: "/dashboard/shipments", icon: Package },
  { name: "Quote Requests", href: "/dashboard/quotations", icon: FileText },
  { name: "Contact Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

const bottomNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col glass-panel shadow-sm hidden md:flex z-40 border-r-0">
      {/* Logo Area */}
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-orange-500/10">
        <Image
          src={business.logoUrl || "/logo.png"}
          alt={business.name}
          width={120}
          height={40}
          className="h-10 w-auto"
          priority
        />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        <div className="mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Overview
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-orange-50 to-transparent text-orange-600 shadow-[inset_2px_0_0_0_#FF6A00]"
                  : "text-gray-600 hover:bg-orange-50/50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 shrink-0 transition-colors duration-200",
                  isActive
                    ? "text-orange-600"
                    : "text-gray-400 group-hover:text-orange-500/70"
                )}
                aria-hidden="true"
              />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}

        <div className="mt-8 mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          System
        </div>
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-orange-50 to-transparent text-orange-600 shadow-[inset_2px_0_0_0_#FF6A00]"
                  : "text-gray-600 hover:bg-orange-50/50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 shrink-0 transition-colors duration-200",
                  isActive
                    ? "text-orange-600"
                    : "text-gray-400 group-hover:text-orange-500/70"
                )}
                aria-hidden="true"
              />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="p-4 border-t border-orange-500/10">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
