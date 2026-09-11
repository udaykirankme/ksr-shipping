import Link from "next/link";
import Image from "next/image";
import { 
  Plane, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function InternationalCourierPage() {
  const destinations = [
    { name: "United States (USA)", slug: "hyderabad-to-usa", timeline: "3-5 business days" },
    { name: "United Kingdom (UK)", slug: "hyderabad-to-uk", timeline: "3-5 business days" },
    { name: "Canada", slug: null, timeline: "4-6 business days" },
    { name: "Australia & New Zealand", slug: null, timeline: "4-7 business days" },
    { name: "UAE & Middle East", slug: null, timeline: "2-4 business days" },
    { name: "Singapore & Malaysia", slug: null, timeline: "2-4 business days" },
    { name: "European Union", slug: null, timeline: "4-6 business days" },
  ];

  const allowedItems = [
    "Homemade sweets, snacks, spices, and non-perishable food products (with food-grade packing)",
    "Eligible prescription medicines accompanied by a registered doctor's prescription and bill",
    "University transcripts, degree certificates, legal papers, and passports",
    "Traditional Indian clothing, garments, textiles, and personal effects",
    "Handicrafts, non-commercial gifts, and dry household goods",
  ];

  const restrictedItems = [
    "Flammable liquids, perfumes, aerosols, and sanitizers",
    "Unregistered chemical compounds and narcotics",
    "Perishable raw food, meat, dairy items, and fresh agricultural produce",
    "Loose lithium-ion batteries and uncertified power banks",
    "Currency notes, jewelry, precious metals, and contraband",
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] pb-20 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "International Courier", path: "/services/international-courier" },
          ]}
        />

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center my-10 lg:my-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
              <Plane className="w-3.5 h-3.5" />
              <span>Worldwide Air Delivery from Hyderabad</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
              International Courier Services from <span className="text-orange-500">Hyderabad</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
              Connect effortlessly with family, clients, and partners across 150+ countries. 
              Enjoy complimentary doorstep pickup throughout Hyderabad, multi-layer protective packaging, 
              customs documentation assistance, and real-time tracking updates.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/get-quotation"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
              >
                Get International Quote
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold transition-all text-sm"
              >
                Track a Shipment
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white aspect-[4/3]">
            <Image
              src="/international_courier.png"
              alt="International Courier Service from Hyderabad"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* High-Value Destination Links */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Popular Global Delivery Lanes</h2>
              <p className="text-sm text-gray-500">Dedicated lanes with express air dispatch and customs support</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
              150+ Countries Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {destinations.map((dest, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-orange-50/40 hover:border-orange-200 transition-all flex items-center justify-between group"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{dest.name}</h3>
                  <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-orange-500" />
                    Est. {dest.timeline}
                  </span>
                </div>
                {dest.slug ? (
                  <Link
                    href={`/services/international-courier/${dest.slug}`}
                    className="text-xs font-semibold text-orange-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    View Guide
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400">Standard Transit</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Allowed vs Prohibited */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-lg font-bold text-gray-900">Items Typically Eligible for Shipping</h3>
            </div>
            <ul className="space-y-3">
              {allowedItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-gray-900">Restricted & Prohibited Cargo</h3>
            </div>
            <ul className="space-y-3">
              {restrictedItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/restricted-items"
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View full restricted items policy
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Required Documentation */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Required Documentation for International Shipping</h2>
          <p className="text-sm text-gray-500 mb-6">Our team assists you with preparation to facilitate smooth customs clearance</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
              <span className="font-bold text-gray-900 block mb-1">1. Sender KYC</span>
              <p className="text-gray-600">Government-issued ID such as Aadhaar Card or Passport copy with current address.</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
              <span className="font-bold text-gray-900 block mb-1">2. Receiver Details</span>
              <p className="text-gray-600">Full legal name, complete street address with postal/zip code, and reachable phone number.</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
              <span className="font-bold text-gray-900 block mb-1">3. Content Declaration</span>
              <p className="text-gray-600">Detailed itemized list of contents. Doctor prescription & chemist bill for medicines.</p>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 sm:p-10 text-white text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Ready to Send a Parcel Overseas?</h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Book a complimentary doorstep pickup anywhere in Hyderabad. We inspect, pack with food-grade materials if needed, and dispatch via top international air carriers.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shadow"
            >
              Get Instant Shipping Quote
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full bg-orange-700/60 hover:bg-orange-700 text-white font-semibold transition-all text-sm border border-orange-400"
            >
              Contact Begumpet Office
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
