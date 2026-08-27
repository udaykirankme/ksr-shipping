"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { business } from "@/lib/config";
import { authService } from "@/lib/auth-service";
import { notificationService } from "@/lib/notification-service";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  FileText,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Shipments", href: "/admin/dashboard/shipments", icon: Package },
  { name: "Quote Requests", href: "/admin/dashboard/quotations", icon: FileText },
  { name: "Contact Messages", href: "/admin/dashboard/messages", icon: MessageSquare },
  { name: "Notifications", href: "/admin/dashboard/notifications", icon: Bell },
  { name: "Reports", href: "/admin/dashboard/reports", icon: BarChart3 },
];

const bottomNavigation = [
  { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  desktopCollapsed?: boolean;
  onDesktopToggle?: () => void;
};

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
  showCloseButton,
  onClose,
  counts,
  collapsed = false,
  onToggleCollapse
}: {
  pathname: string;
  onNavigate: () => void;
  onLogout: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  counts?: { unreadQuotes: number; unreadContacts: number; };
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const renderLink = (item: NavItem) => {
    const isActive = item.href === '/admin/dashboard' 
      ? pathname === item.href 
      : pathname.startsWith(item.href);
    
    let badgeCount = 0;
    if (item.name === "Quote Requests") badgeCount = counts?.unreadQuotes || 0;
    if (item.name === "Contact Messages") badgeCount = counts?.unreadContacts || 0;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
          collapsed ? "justify-center px-0 mx-2" : "px-3",
          isActive
            ? "bg-gradient-to-r from-orange-50 to-transparent text-orange-600 shadow-[inset_2px_0_0_0_#FF6A00]"
            : "text-gray-600 hover:bg-orange-50/50 hover:text-gray-900"
        )}
        title={collapsed ? item.name : undefined}
      >
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-200",
            collapsed ? "mx-auto" : "mr-3",
            isActive ? "text-orange-600" : "text-gray-400 group-hover:text-orange-500/70"
          )}
          aria-hidden="true"
        />
        {!collapsed && <span className="relative z-10 flex-1">{item.name}</span>}
        {badgeCount > 0 && !collapsed && (
          <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
        {badgeCount > 0 && collapsed && (
          <span className="absolute top-1.5 right-2.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </Link>
    );
  };

  return (
    <>
      <div className={cn("flex h-20 shrink-0 items-center border-b border-orange-500/10", collapsed ? "justify-center px-0" : "justify-between px-6")}>
        {!collapsed ? (
          <Image
            src={business.logoUrl || "/logo.png"}
            alt={business.name}
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        ) : (
          <div className="flex items-center justify-center w-full px-2" title={business.name}>
            <Image
              src={business.logoUrl || "/logo.png"}
              alt={business.name}
              width={60}
              height={20}
              className="h-6 w-auto object-contain"
              priority
            />
          </div>
        )}
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden -mr-2 p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-orange-50 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 py-6 overflow-y-auto overflow-x-hidden" aria-label="Admin navigation">
        <div className={cn("mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-all", collapsed ? "text-center px-0" : "px-6")}>
          {collapsed ? "..." : "Overview"}
        </div>
        <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {navigation.map(renderLink)}
        </div>

        <div className={cn("mt-8 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-all", collapsed ? "text-center px-0" : "px-6")}>
          {collapsed ? "..." : "System"}
        </div>
        <div className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {bottomNavigation.map(renderLink)}
        </div>
      </nav>

      <div className="p-4 border-t border-orange-500/10 space-y-2">
        <button
          onClick={onLogout}
          className={cn(
            "group flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200",
            collapsed ? "justify-center px-0 mx-auto" : "px-3"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className={cn("h-5 w-5 shrink-0 transition-colors duration-200", collapsed ? "mx-auto text-gray-400 group-hover:text-red-500" : "mr-3 text-gray-400 group-hover:text-red-500")} />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose, desktopCollapsed = false, onDesktopToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMounted = useRef(false);
  const [counts, setCounts] = useState({ unreadQuotes: 0, unreadContacts: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const isEffectivelyCollapsed = desktopCollapsed && !isHovered;

  const fetchCounts = async () => {
    try {
      const res = await notificationService.getUnreadCounts();
      if (isMounted.current) {
        setCounts(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchCounts();
    
    const intervalId = setInterval(() => {
      if (isMounted.current) fetchCounts();
    }, 15000);
    
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (pathname === '/admin/dashboard/quotations') {
      setCounts(prev => ({ ...prev, unreadQuotes: 0 }));
    }
    if (pathname === '/admin/dashboard/messages') {
      setCounts(prev => ({ ...prev, unreadContacts: 0 }));
    }
    if (pathname === '/admin/dashboard/notifications') {
      setCounts(prev => ({ ...prev, unreadCount: 0 })); // Note: typings for counts? Just mimicking original
    }
    fetchCounts();
    onMobileClose?.();
  }, [pathname, onMobileClose]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    onMobileClose?.();
    await authService.logout();
    router.push("/admin/login");
    router.refresh();
  };

  const handleNavigate = () => {
    onMobileClose?.();
  };

  return (
    <>
      {/* Desktop sidebar placeholder to push content */}
      <div className={cn("hidden md:block h-full shrink-0 transition-[width] duration-300 ease-in-out", desktopCollapsed ? "w-20" : "w-64")} />
      
      {/* Desktop sidebar floating */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "hidden md:flex fixed top-0 left-0 h-full flex-col bg-[#FFF7F0] shadow-[0_0_40px_rgba(0,0,0,0.05)] z-40 border-r border-orange-500/10 shrink-0 transition-[width] duration-300 ease-in-out",
          isEffectivelyCollapsed ? "w-20" : "w-64"
        )}
        aria-label="Admin sidebar"
      >
        <SidebarContent
          pathname={pathname}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          counts={counts}
          collapsed={isEffectivelyCollapsed}
        />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          onClick={onMobileClose}
          aria-label="Close sidebar overlay"
          tabIndex={mobileOpen ? 0 : -1}
        />

        <aside
          id="admin-mobile-sidebar"
          className={cn(
            "absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col bg-[#FFF7F0] shadow-2xl border-r border-orange-500/15 transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          aria-label="Admin sidebar"
          aria-hidden={!mobileOpen}
        >
          <SidebarContent
            pathname={pathname}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            showCloseButton
            onClose={onMobileClose}
            counts={counts}
            collapsed={false}
          />
        </aside>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-orange-100 w-full max-w-sm p-6 sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
              <LogOut className="h-7 w-7 text-red-500" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Sign Out</h3>
            <p className="text-sm text-gray-500 text-center mb-8">
              Are you sure you want to sign out of your account? You will need to log in again to access the dashboard.
            </p>
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl h-11"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 border-transparent shadow-sm hover:shadow"
                onClick={confirmLogout}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
