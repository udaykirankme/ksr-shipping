"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { business } from "@/lib/config";
import { authService } from "@/lib/auth-service";
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
import { useEffect } from "react";

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
}: {
  pathname: string;
  onNavigate: () => void;
  onLogout: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  const renderLink = (item: NavItem) => {
    const isActive = pathname === item.href;

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onNavigate}
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
            isActive ? "text-orange-600" : "text-gray-400 group-hover:text-orange-500/70"
          )}
          aria-hidden="true"
        />
        <span className="relative z-10">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      <div className="flex h-20 shrink-0 items-center justify-between px-6 border-b border-orange-500/10">
        <Image
          src={business.logoUrl || "/logo.png"}
          alt={business.name}
          width={120}
          height={40}
          className="h-10 w-auto"
          priority
        />
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

      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto" aria-label="Admin navigation">
        <div className="mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Overview
        </div>
        {navigation.map(renderLink)}

        <div className="mt-8 mb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          System
        </div>
        {bottomNavigation.map(renderLink)}
      </nav>

      <div className="p-4 border-t border-orange-500/10">
        <button
          onClick={onLogout}
          className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
          Sign Out
        </button>
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    onMobileClose?.();
  }, [pathname, onMobileClose]);

  const handleLogout = async () => {
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
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex h-full w-64 flex-col glass-panel shadow-sm z-40 border-r-0 shrink-0"
        aria-label="Admin sidebar"
      >
        <SidebarContent
          pathname={pathname}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
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
          />
        </aside>
      </div>
    </>
  );
}
