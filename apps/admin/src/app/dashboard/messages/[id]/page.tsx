import { MessageDetailClient } from "./message-detail-client";

export const metadata = {
  title: "Message Details | KSR Shipping Services Admin",
};

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <MessageDetailClient messageId={id} />
    </div>
  );
}
