"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileSidebar();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen, closeMobileSidebar]);

  return (
    <div className="flex h-screen overflow-hidden bg-[linear-gradient(135deg,#FFF7F0_0%,#FFF3E8_50%,#FFE8D6_100%)] text-[#1A1A1A]">
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={closeMobileSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={openMobileSidebar} mobileSidebarOpen={mobileSidebarOpen} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] z-0 pointer-events-none" />
          <div className="relative z-10 w-full h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
