import { QuoteListClient } from "./quote-list-client";

export const metadata = {
  title: "Quote Requests | KSR Shipping Services Admin",
};

export default function QuotationsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <QuoteListClient />
    </div>
  );
}
