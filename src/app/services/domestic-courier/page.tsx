import Link from "next/link";
import Image from "next/image";
import { 
  Truck, 
  Plane, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function DomesticCourierPage() {
  const modes = [
    {
      title: "Domestic Air Courier",
      icon: Plane,
      badge: "Express Speed",
      description: "Priority air transit designed for time-sensitive packages, important documents, and high-value consignments connecting major Indian metros.",
      timeline: "24 - 48 Hours (Major Metros)",
      idealFor: "Urgent documents, electronics, gifts, and expedited parcels.",
    },
    {
      title: "Domestic Road / Surface Courier",
      icon: Truck,
      badge: "Economical & Bulk",
      description: "Cost-effective surface transport network covering all tier 1, tier 2, and tier 3 cities, industrial hubs, and remote pincodes across India.",
      timeline: "3 - 7 Business Days (Distance Dependent)",
      idealFor: "Heavy boxes, commercial cargo, household relocations, and non-urgent parcels.",
    },
  ];

  const cityHighlights = [
    { name: "Bengaluru & Karnataka", time: "Next-Day Air / 2-3 Days Surface" },
    { name: "Chennai & Tamil Nadu", time: "Next-Day Air / 2-3 Days Surface" },
    { name: "Mumbai & Maharashtra", time: "1-2 Days Air / 3-4 Days Surface" },
    { name: "Delhi NCR & North India", time: "1-2 Days Air / 4-5 Days Surface" },
    { name: "Kolkata & East India", time: "2-3 Days Air / 5-6 Days Surface" },
    { name: "Andhra Pradesh & Telangana", time: "Same-Day to Next-Day Delivery" },
  ];

  const faqs = [
    {
      q: "Do you pick up domestic packages from my home in Hyderabad?",
      a: "Yes, we offer complimentary doorstep pickup across all areas in Hyderabad and Secunderabad, including Begumpet, Banjara Hills, Jubilee Hills, Hitec City, Gachibowli, Kukatpally, and Uppal.",
    },
    {
      q: "What is the difference between Air and Surface domestic courier?",
      a: "Domestic Air Courier uses commercial air freight for the fastest delivery (typically 1 to 2 business days to major metros). Domestic Surface Courier travels via road or rail network and offers substantial cost savings for bulk and heavier consignments.",
    },
    {
      q: "Which courier delivery partners do you work with for domestic shipping?",
      a: "We work strategically with India's leading domestic logistics networks including DTDC, Delhivery, Shadowfax, and Ekart to route your shipment via the most reliable carrier for the destination pincode.",
    },
    {
      q: "Can I track my domestic parcel?",
      a: "Yes, all domestic shipments are assigned a real-time tracking number accessible 24/7 on ksrshipping.com/track.",
    },
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
            { name: "Domestic Courier", path: "/services/domestic-courier" },
          ]}
        />

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center my-10 lg:my-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
              <Truck className="w-3.5 h-3.5" />
              <span>Pan-India Courier Network</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
              Domestic Courier Services <span className="text-orange-500">Across India</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
              Fast, reliable, and secure courier services connecting Hyderabad to all states, cities, and pincodes across India. Choose Air Courier for urgent deliveries or Road Surface Courier for economical shipping, complete with complimentary doorstep pickup.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/get-quotation"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
              >
                Get Domestic Quote
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold transition-all text-sm"
              >
                Track Shipment
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white aspect-[4/3]">
            <Image
              src="/domestic_courier.png"
              alt="Domestic Courier Services Across India"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* Air vs Surface Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {modes.map((mode, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100/70 text-orange-600 flex items-center justify-center">
                    <mode.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    {mode.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{mode.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{mode.description}</p>
              </div>

              <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1.5">
                <div><strong className="text-gray-900">Transit:</strong> {mode.timeline}</div>
                <div><strong className="text-gray-900">Best for:</strong> {mode.idealFor}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Coverage Highlights */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Major Domestic Destinations from Hyderabad</h2>
              <p className="text-sm text-gray-500">Regular daily departures connecting major economic zones</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
              Pan-India Coverage
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cityHighlights.map((dest, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
                <span className="font-bold text-gray-900 text-sm block mb-1">{dest.name}</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  {dest.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{faq.q}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 sm:p-10 text-white text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Send a Domestic Parcel from Hyderabad</h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Enjoy complimentary doorstep pickup from home or office. We assist with packaging and assign a tracking code right away.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shadow"
            >
              Request Domestic Quote
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full bg-orange-700/60 hover:bg-orange-700 text-white font-semibold transition-all text-sm border border-orange-400"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
