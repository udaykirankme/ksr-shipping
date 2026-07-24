import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[linear-gradient(135deg,#FFF7F0_0%,#FFF3E8_50%,#FFE8D6_100%)] text-[#1A1A1A]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] z-0 pointer-events-none" />
          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
