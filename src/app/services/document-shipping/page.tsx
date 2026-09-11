import Link from "next/link";
import Image from "next/image";
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function DocumentShippingPage() {
  const documentTypes = [
    {
      title: "University & Student Applications",
      desc: "Academic transcripts, degree certificates, letters of recommendation, and university enrollment dossiers.",
    },
    {
      title: "Legal & Corporate Contracts",
      desc: "Business agreements, affidavits, deeds, power of attorney, and audit filings requiring confidential handling.",
    },
    {
      title: "Immigration & Visa Papers",
      desc: "Passports, work permits, visa applications, and embassy submissions with signature confirmation upon delivery.",
    },
    {
      title: "Financial & Tender Documents",
      desc: "Bank guarantees, financial reports, tender bids, and critical paperwork delivered on strict deadlines.",
    },
  ];

  const faqs = [
    {
      q: "How fast can an urgent document reach the USA or UK from Hyderabad?",
      a: "Express international document shipments typically arrive in 2 to 4 business days, depending on destination customs clearance.",
    },
    {
      q: "How are confidential papers protected?",
      a: "All documents are enclosed in tamper-evident, moisture-resistant security envelopes with verified barcode tracking at every transit scan.",
    },
    {
      q: "Do you offer doorstep pickup for urgent documents in Hyderabad?",
      a: "Yes, we provide same-day complimentary doorstep collection across Hyderabad, including IT corridors such as Hitec City, Gachibowli, and Madhapur.",
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
            { name: "Document Shipping", path: "/services/document-shipping" },
          ]}
        />

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center my-10 lg:my-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
              <FileText className="w-3.5 h-3.5" />
              <span>Priority Document Delivery</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
              Express Document Courier from <span className="text-orange-500">Hyderabad</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
              Confidential, tamper-evident, and time-critical delivery of university transcripts, legal agreements, passports, and corporate contracts across India and worldwide.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/get-quotation"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
              >
                Send Urgent Document
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold transition-all text-sm"
              >
                Track Document
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white aspect-[4/3]">
            <Image
              src="/express_document_delivery.png"
              alt="Express Document Delivery Service"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* Document Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {documentTypes.map((item, i) => (
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Need to Dispatch Urgent Papers?</h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Book a rapid doorstep pickup in Hyderabad. Enclosed in tamper-proof security envelopes and expedited via priority air.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shadow"
            >
              Get Document Quote
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
