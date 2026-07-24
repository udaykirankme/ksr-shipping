"use client";

import { useState } from "react";
import { 
  Briefcase, 
  Truck, 
  Bell,
  User
} from "lucide-react";
import ServicesTab from "./tabs/services-tab";
import ServiceThroughTab from "./tabs/service-through-tab";
import AccountTab from "./tabs/account-tab";
import NotificationsTab from "./tabs/notifications-tab";

const TABS = [
  { id: "services", label: "Services", icon: Briefcase, component: ServicesTab },
  { id: "service-through", label: "Service Through", icon: Truck, component: ServiceThroughTab },
  { id: "account", label: "Admin Account", icon: User, component: AccountTab },
  { id: "notifications", label: "Notification Settings", icon: Bell, component: NotificationsTab },
];

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState("services");

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || ServicesTab;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-64 flex-shrink-0">
        <nav className="flex flex-col space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-700" : "text-gray-600"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
