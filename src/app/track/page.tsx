import { Suspense } from "react";
import TrackResult from "./TrackResult";
import Link from "next/link";
import { Headset } from "lucide-react";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import { prisma } from "@/lib/db";
import { sanitizeHistoryForCustomer, sanitizeCustomerHistoryNote } from "@/lib/courier/identity";

type TrackPageProps = {
  searchParams: Promise<{ id?: string }>;
};

async function getInitialTrackingData(id?: string) {
  if (!id?.trim()) return null;
  try {
    const shipment = await prisma.shipment.findFirst({
      where: {
        tracking_id: id.trim(),
      },
      select: {
        tracking_id: true,
        current_status: true,
        estimated_delivery: true,
        origin: true,
        destination: true,
        sender_name: true,
        receiver_name: true,
        sender_city: true,
        receiver_city: true,
        booked_date: true,
        medium: true,
        current_location: true,
        customer_update: true,
        history: {
          select: {
            status: true,
            location: true,
            note: true,
            occurred_at: true,
          },
          orderBy: [
            { occurred_at: 'desc' },
            { created_at: 'desc' },
          ],
        },
      },
    });

    if (!shipment) return null;

    const cleanedHistory = sanitizeHistoryForCustomer(shipment.history);
    const cleanedCustomerUpdate = shipment.customer_update ? sanitizeCustomerHistoryNote(shipment.customer_update) : null;

    return JSON.parse(JSON.stringify({
      ...shipment,
      customer_update: cleanedCustomerUpdate,
      history: cleanedHistory,
    }));
  } catch (err) {
    console.error("Server tracking fetch fallback:", err);
    return null;
  }
}

export async function generateMetadata({ searchParams }: TrackPageProps): Promise<Metadata> {
  const params = await searchParams;
  if (params?.id) {
    return {
      title: "Track Shipment",
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      },
      alternates: {
        canonical: absoluteUrl("/track"),
      },
    };
  }
  return {
    alternates: {
      canonical: absoluteUrl("/track"),
    },
  };
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;
  const initialData = await getInitialTrackingData(params?.id);

  return (
    <div className="min-h-[90vh] bg-gray-50 pt-[74px] sm:pt-[82px] lg:pt-[92px] pb-24 relative overflow-hidden flex flex-col">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-grow flex flex-col">
        <div className="mb-20">
          <Suspense fallback={
            <div className="text-center pt-2 sm:pt-4 mb-8 sm:mb-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">Track Your <span className="text-orange-500">Shipment</span></h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Loading shipment details...
              </p>
            </div>
          }>
            <TrackResult initialData={initialData} />
          </Suspense>
        </div>

        {/* Contact Support CTA */}
        <div className="mt-auto bg-white p-8 md:p-10 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 text-center flex flex-col items-center max-w-2xl mx-auto transition-all hover:shadow-[0_10px_30px_-15px_rgba(249,115,22,0.2)] hover:border-orange-200">
           <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-5 text-orange-500 shadow-inner">
              <Headset className="w-7 h-7" />
           </div>
           <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Facing Issues with Tracking?</h3>
           <p className="text-gray-600 mb-8 leading-relaxed max-w-lg">
             If your tracking information hasn&apos;t updated or you need further assistance with your shipment, our support team is ready to help.
           </p>
           <Link href="/contact" className="inline-flex h-12 items-center justify-center px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:-translate-y-1 hover:from-orange-600 hover:to-orange-700">
              Contact Support
           </Link>
        </div>
      </div>
    </div>
  );
}
