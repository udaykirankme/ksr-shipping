"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { business } from "@/lib/config";
import { authService } from "@/lib/auth-service";
import { notificationService } from "@/lib/notification-service";
import {
  LayoutDashboard,
  Package,
  FileText,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Shipments", href: "/admin/dashboard/shipments", icon: Package },
  { name: "Quote Requests", href: "/admin/dashboard/quotations", icon: FileText, countKey: 'quotes' },
  { name: "Contact Messages", href: "/admin/dashboard/messages", icon: MessageSquare, countKey: 'messages' },
  { name: "Notifications", href: "/admin/dashboard/notifications", icon: Bell },
  { name: "Reports", href: "/admin/dashboard/reports", icon: BarChart3 },
];

const bottomNavigation = [
  { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
];

export function Sidebar({ 
  isOpen = false, 
  setIsOpen 
}: { 
  isOpen?: boolean; 
  setIsOpen?: (v: boolean) => void;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();

  const [unreadQuotes, setUnreadQuotes] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const data = await notificationService.getNotifications({ limit: 100 });
        const unread = data.items.filter(n => !n.read_at);
        
        const quoteIds = unread.filter(n => n.type === 'QUOTE_REQUEST').map(n => n.id);
        const msgIds = unread.filter(n => n.type === 'CONTACT_MESSAGE').map(n => n.id);
        
        if (pathname === '/admin/dashboard/quotations' && quoteIds.length > 0) {
           await notificationService.markBulkAsRead(quoteIds);
           setUnreadQuotes(0);
        } else {
           setUnreadQuotes(quoteIds.length);
        }

        if (pathname === '/admin/dashboard/messages' && msgIds.length > 0) {
           await notificationService.markBulkAsRead(msgIds);
           setUnreadMessages(0);
        } else {
           setUnreadMessages(msgIds.length);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsOpen?.(false)}
        />
      )}
      <div className={cn(
        "fixed inset-y-0 left-0 flex h-full w-64 flex-col bg-white shadow-xl z-50 border-r border-orange-500/10 transform transition-transform duration-300 md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
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
          const count = item.countKey === 'quotes' ? unreadQuotes : item.countKey === 'messages' ? unreadMessages : 0;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen?.(false)}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-orange-50 to-transparent text-orange-600 shadow-[inset_2px_0_0_0_#FF6A00]"
                  : "text-gray-600 hover:bg-orange-50/50 hover:text-gray-900"
              )}
            >
              <div className="flex items-center">
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
              </div>
              {count > 0 && (
                <span className="relative z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {count > 99 ? '99+' : count}
                </span>
              )}
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
              onClick={() => setIsOpen?.(false)}
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
    </>
  );
}
