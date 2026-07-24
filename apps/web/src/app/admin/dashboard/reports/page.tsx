import { ReportsClient } from "./reports-client";

export const metadata = {
  title: "Reports & Analytics | KSR Shipping Services Admin",
};

export default function ReportsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <ReportsClient />
    </div>
  );
}
