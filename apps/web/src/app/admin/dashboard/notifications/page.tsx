import { NotificationListClient } from "./notification-list-client";

export const metadata = {
  title: "Notifications | KSR Shipping Services Admin",
};

export default function NotificationsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <NotificationListClient />
    </div>
  );
}
