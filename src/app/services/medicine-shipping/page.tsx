import Link from "next/link";
import Image from "next/image";
import { 
  HeartPulse, 
  ShieldCheck, 
  FileText, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function MedicineShippingPage() {
  const documents = [
    {
      title: "Doctor's Prescription",
      desc: "Legible prescription from a registered medical practitioner specifying patient name, medication name, dosage, and duration.",
    },
    {
      title: "Chemist Tax Invoice / Bill",
      desc: "Original retail pharmacy invoice detailing batch number, expiry date, quantity, and cost matching the prescription.",
    },
    {
      title: "Sender & Patient KYC",
      desc: "Valid government-issued identity proof (Aadhaar or Passport) of the sender and recipient / patient.",
    },
  ];

  const faqs = [
    {
      q: "Can I send prescription medicines to family in the USA or UK?",
      a: "Yes, eligible prescription medicines for personal use can be shipped internationally, subject to destination customs and health authority import regulations. A valid doctor's prescription and pharmacy bill are mandatory.",
    },
    {
      q: "Can over-the-counter (OTC) drugs and Ayurvedic medicines be shipped?",
      a: "Yes, commercially labeled OTC products and packaged Ayurvedic/homeopathic formulations with clear manufacturer labeling, ingredients list, and batch numbers can be shipped with appropriate invoices.",
    },
    {
      q: "Are narcotics or psychotropic substances allowed?",
      a: "No. Controlled substances, narcotics, prohibited psychotropic medications, and unlabelled bulk liquids/powders are strictly prohibited under national and international aviation laws.",
    },
    {
      q: "Do you offer doorstep pickup for medicine parcels in Hyderabad?",
      a: "Yes, KSR Shipping Services provides complimentary doorstep collection across Hyderabad. We inspect documentation and package medications securely before dispatch.",
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
            { name: "Medicine Shipping", path: "/services/medicine-shipping" },
          ]}
        />

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center my-10 lg:my-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold mb-4 border border-red-200">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Healthcare & Prescription Logistics</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
              Medicine Courier Services from <span className="text-orange-500">Hyderabad</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
              Compliant, temperature-aware, and prioritized transportation of essential prescription medications and health supplies to domestic and international destinations worldwide.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/get-quotation"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
              >
                Get Medicine Shipping Quote
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold transition-all text-sm"
              >
                Documentation Guidance
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white aspect-[4/3]">
            <Image
              src="/medicine_shipping.png"
              alt="Medicine Shipping Service from Hyderabad"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* Mandatory Documentation */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm mb-12">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Mandatory Documentation Requirements</h2>
          </div>
          <p className="text-sm text-gray-500 mb-8">
            To comply with destination customs and international health regulations, please ensure you have the following ready:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {documents.map((doc, i) => (
              <div key={i} className="p-5 rounded-2xl bg-orange-50/50 border border-orange-100">
                <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center mb-3">
                  {i + 1}
                </span>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{doc.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Advisory Box */}
        <div className="rounded-2xl p-6 bg-blue-50/80 border border-blue-200 text-blue-900 text-xs sm:text-sm mb-12 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-1 text-blue-950">Compliance & Destination Import Regulations</strong>
            <span>
              All medicine shipments are processed strictly in accordance with Indian export laws and the recipient country&apos;s customs/health guidelines. Medicines must remain in original blister foil/bottle packaging with manufacturer labels and visible expiry dates.
            </span>
          </div>
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Need Urgent Healthcare Logistics?</h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Contact our Begumpet team for prescription verification and priority doorstep pickup across Hyderabad.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shadow"
            >
              Request Quotation
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
