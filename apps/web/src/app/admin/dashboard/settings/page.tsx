import SettingsClient from "@/components/settings/settings-client";

export const metadata = {
  title: "Settings | KSR Shipping Services Admin",
};

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-700 mt-1">Manage all configurable business aspects of KSR Shipping Services.</p>
      </div>
      <SettingsClient />
    </div>
  );
}
