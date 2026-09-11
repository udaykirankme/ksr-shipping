import Link from "next/link";
import { 
  Plane, 
  Clock, 
  ShieldCheck, 
  Package, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function HyderabadToUkPage() {
  const commonItems = [
    {
      title: "Homemade Sweets & Snacks",
      desc: "Traditional laddoos, snacks, and regional Telangana food items packed with food-grade materials to preserve taste and hygiene.",
    },
    {
      title: "University Applications & Transcripts",
      desc: "Express document delivery to UK universities and colleges with signature on delivery.",
    },
    {
      title: "Handcrafted Pickles & Powders",
      desc: "Leak-resistant multi-layered packaging engineered to withstand air pressure and handling during transit to London, Birmingham, Manchester, and across the UK.",
    },
    {
      title: "Prescription Medicines",
      desc: "Urgent medical supplies and personal prescriptions with complete documentation and invoice support.",
    },
    {
      title: "Garments & Traditional Attire",
      desc: "Protective packaging for wedding wear, traditional clothing, and fabrics.",
    },
  ];

  const faqs = [
    {
      q: "How long does shipping from Hyderabad to London/UK take?",
      a: "Express transit typically takes 3 to 5 business days, while standard air services take 5 to 7 business days, depending on UK customs clearance.",
    },
    {
      q: "Can I ship homemade food items to the UK?",
      a: "Yes, commercially packed or properly sealed homemade non-perishable food items, sweets, and dry snacks are acceptable with our specialized food-grade packaging.",
    },
    {
      q: "Is doorstep collection free across Hyderabad?",
      a: "Yes, KSR Shipping Services provides complimentary doorstep pickup throughout Hyderabad and Secunderabad for UK-bound consignments.",
    },
    {
      q: "Can I track my parcel en route to the UK?",
      a: "Yes, you receive a real-time tracking number allowing you to track milestone scans 24/7 on ksrshipping.com/track.",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] pb-20 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "International Courier", path: "/services/international-courier" },
            { name: "Hyderabad to UK", path: "/services/international-courier/hyderabad-to-uk" },
          ]}
        />

        {/* Hero */}
        <div className="my-10 lg:my-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
            <Plane className="w-3.5 h-3.5" />
            <span>Air Cargo Lane: Hyderabad (HYD) to United Kingdom (UK)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4">
            International Courier from <span className="text-orange-500">Hyderabad to UK</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl">
            Deliver parcels to London, Birmingham, Manchester, Edinburgh, and across the UK. 
            Enjoy zero-fee doorstep pickup in Hyderabad, specialized food-grade packing, and end-to-end milestone tracking.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/get-quotation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
            >
              Get UK Courier Rate
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

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <Clock className="w-6 h-6 text-orange-500 mb-2" />
            <span className="font-bold text-gray-900 block text-sm">Estimated Transit</span>
            <p className="text-xs text-gray-500 mt-1">Express: 3-5 business days<br />Standard: 5-7 business days</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <Package className="w-6 h-6 text-orange-500 mb-2" />
            <span className="font-bold text-gray-900 block text-sm">Food-Grade Materials</span>
            <p className="text-xs text-gray-500 mt-1">Hygienic multi-layer packing for traditional homemade sweets and snacks.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <MapPin className="w-6 h-6 text-orange-500 mb-2" />
            <span className="font-bold text-gray-900 block text-sm">Hyderabad Free Pickup</span>
            <p className="text-xs text-gray-500 mt-1">Complimentary doorstep collection across all Hyderabad and Secunderabad localities.</p>
          </div>
        </div>

        {/* Common Items */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Consignments Frequently Sent to the UK</h2>
          <p className="text-sm text-gray-500 mb-6">Designed to keep families, students, and businesses connected</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commonItems.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed pl-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-10">
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

        {/* Callout */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div>
            <h3 className="text-xl font-bold">Courier from Hyderabad to the UK?</h3>
            <p className="text-xs sm:text-sm text-orange-100 mt-1">Book your free doorstep collection today or request pricing details.</p>
          </div>
          <Link
            href="/get-quotation"
            className="px-6 py-2.5 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shrink-0 shadow"
          >
            Get Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
