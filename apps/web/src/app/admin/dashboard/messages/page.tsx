import { MessageListClient } from "./message-list-client";

export const metadata = {
  title: "Contact Messages | KSR Shipping Services Admin",
};

export default function MessagesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <MessageListClient />
    </div>
  );
}
