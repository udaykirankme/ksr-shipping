import { QuoteDetailClient } from "./quote-detail-client";

export const metadata = {
  title: "Quote Details | KSR Shipping Services Admin",
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuoteDetailClient id={id} />;
}
