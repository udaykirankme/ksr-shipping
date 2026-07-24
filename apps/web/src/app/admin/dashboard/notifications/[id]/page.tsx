import { NotificationDetailClient } from "./notification-detail-client";

export const metadata = {
  title: "Notification Details | KSR Shipping Services Admin",
};

export default async function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <NotificationDetailClient id={id} />
    </div>
  );
}
