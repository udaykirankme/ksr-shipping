import Link from "next/link";
import Image from "next/image";
import { 
  Building2, 
  Truck, 
  Layers, 
  Clock, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function CommercialShippingPage() {
  const capabilities = [
    {
      title: "Bulk Parcel Distribution",
      desc: "Multi-carton dispatches and consolidated consignments shipped across India or internationally with volume-based pricing.",
    },
    {
      title: "Warehouse & Factory Collection",
      desc: "Scheduled regular pickups from manufacturing units, e-commerce fulfillment hubs, and corporate offices across Hyderabad.",
    },
    {
      title: "Commercial Documentation Assistance",
      desc: "Guidance on GST invoices, packing lists, Importer Exporter Code (IEC) declarations, and customs formalities.",
    },
    {
      title: "Flexible Freight Modes",
      desc: "Choose between air freight for rapid delivery or surface cargo for economical distribution of heavier consignments.",
    },
  ];

  const faqs = [
    {
      q: "Do you offer corporate or volume accounts for businesses?",
      a: "Yes, we support businesses, startups, and e-commerce merchants in Hyderabad with customized corporate shipping solutions and volume-tiered pricing.",
    },
    {
      q: "What commercial documentation is required for B2B shipments?",
      a: "For domestic B2B cargo, GST invoices and e-Way bills (where applicable) are required. For international commercial exports, a commercial invoice, packing list, and valid IEC are needed.",
    },
    {
      q: "Can you arrange regular weekly or daily warehouse pickups in Hyderabad?",
      a: "Yes, our logistics team coordinates scheduled warehouse and office pickups across industrial and business zones in Hyderabad and Secunderabad.",
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
            { name: "Commercial Shipping", path: "/services/commercial-shipping" },
          ]}
        />

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center my-10 lg:my-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
              <Building2 className="w-3.5 h-3.5" />
              <span>B2B & Enterprise Logistics</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
              Commercial Cargo & B2B <span className="text-orange-500">Shipping</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
              Scalable commercial freight and bulk courier solutions for Hyderabad businesses. Warehouse collections, scheduled dispatches, and multi-modal logistics across India and worldwide.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/get-quotation"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
              >
                Request Commercial Quote
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold transition-all text-sm"
              >
                Contact Business Team
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white aspect-[4/3]">
            <Image
              src="/commercial_shipping.png"
              alt="Commercial Shipping and B2B Logistics"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* Capabilities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {capabilities.map((item, i) => (
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Expand Your Commercial Distribution</h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Partner with KSR Shipping Services for reliable domestic cargo dispatches and international freight forwarding from Hyderabad.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shadow"
            >
              Get B2B Rates
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full bg-orange-700/60 hover:bg-orange-700 text-white font-semibold transition-all text-sm border border-orange-400"
            >
              Call +91 99638 14267
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
