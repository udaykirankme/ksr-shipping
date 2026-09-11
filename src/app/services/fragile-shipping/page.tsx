import Link from "next/link";
import Image from "next/image";
import { 
  Box, 
  ShieldCheck, 
  Layers, 
  PackageCheck, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function FragileShippingPage() {
  const fragileItems = [
    {
      title: "Glassware & Ceramics",
      desc: "Vases, porcelain crockery, mirrors, and delicate decor items wrapped with individual honeycomb cushioning and foam buffers.",
    },
    {
      title: "Electronics & Gadgets",
      desc: "Laptops, high-end cameras, computer accessories, and audio gear enclosed in anti-static, shock-absorbing materials.",
    },
    {
      title: "Artwork & Handicrafts",
      desc: "Framed canvas paintings, sculptures, and traditional brass/clay artifacts safeguarded with corner protectors and custom boxing.",
    },
    {
      title: "Precision Instruments",
      desc: "Testing equipment, optical instruments, and delicate tools cushioned with custom-cut polyethylene foam.",
    },
  ];

  const faqs = [
    {
      q: "How does KSR Shipping pack fragile items to prevent damage?",
      a: "We apply a multi-layered protective approach: primary wrap using high-grade bubble or honeycomb cushioning, edge and corner guards, void-fill peanuts to eliminate interior movement, and sturdy double-wall corrugated outer cartons.",
    },
    {
      q: "Do you offer packing services at my home in Hyderabad?",
      a: "Yes, our team can collect your items directly from your home or office in Hyderabad and pack them using specialized protective materials.",
    },
    {
      q: "Can fragile goods be shipped domestically and internationally?",
      a: "Yes, our fragile packaging protocols apply to both pan-India domestic routes and international air consignments to 150+ countries.",
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
            { name: "Fragile Shipping", path: "/services/fragile-shipping" },
          ]}
        />

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center my-10 lg:my-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
              <Box className="w-3.5 h-3.5" />
              <span>Protective Packaging Solutions</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
              Fragile & Delicate Item <span className="text-orange-500">Shipping</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
              Expert multi-layer packaging, shock absorption, and delicate handling procedures designed to protect glassware, artwork, precision electronics, and high-value items across town or across continents.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/get-quotation"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
              >
                Get Fragile Shipping Quote
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
              src="/fragile_shipping.png"
              alt="Fragile Item Shipping Service"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* Item Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {fragileItems.map((item, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm mb-12">
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

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 sm:p-10 text-white text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Shipping Fragile or Valuable Goods?</h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Schedule a doorstep pickup in Hyderabad. Our team arrives with protective materials to pack your delicate cargo securely.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shadow"
            >
              Get Free Quote
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
