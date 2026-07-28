import { AdminDashboardShell } from "@/components/layout/admin-dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
