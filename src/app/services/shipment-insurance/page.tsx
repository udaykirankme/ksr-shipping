import Link from "next/link";
import { 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight, 
  Phone, 
  CheckCircle2, 
  FileText,
  Building2,
  Globe2,
  Package
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { business } from "@/lib/config";

const tiers = [
  {
    tier: "Domestic Shipments (< 30 kg)",
    coverage: "Complimentary up to ₹30,000",
    description: "Included transit protection against transit loss or damage for domestic courier parcels under 30 kg.",
    icon: Package,
    badge: "Complimentary",
  },
  {
    tier: "Commercial & B2B Shipments",
    coverage: "Full Insurance Available",
    description: "Comprehensive coverage available for corporate and commercial consignments, subject to applicable terms and a valid product invoice.",
    icon: Building2,
    badge: "Invoice Required",
  },
  {
    tier: "International Shipments",
    coverage: "Insurance Available",
    description: "Transit insurance coverage available for overseas shipments, subject to destination carrier policies, formal damage assessment, and claim conditions.",
    icon: Globe2,
    badge: "Carrier Terms",
  },
];

const faqs = [
  {
    question: "Is transit insurance included for domestic parcels?",
    answer:
      "Yes. For domestic courier shipments under 30 kg, complimentary transit insurance coverage up to ₹30,000 is included against transit loss or damage.",
  },
  {
    question: "What are the requirements for commercial or B2B consignment insurance?",
    answer:
      "Commercial and B2B shipments can have full insurance coverage, which may require submission of a valid commercial product invoice and adherence to applicable courier partner terms.",
  },
  {
    question: "How is international shipment insurance handled?",
    answer:
      "International insurance coverage is available subject to destination carrier policies, formal damage assessment, and applicable claim conditions.",
  },
  {
    question: "Does KSR Shipping Services operate delivery networks directly?",
    answer:
      "No. KSR collects, professionally packs, and books shipments through established courier partners (such as DHL, FedEx, UPS, DTDC, and Delhivery); KSR does not operate delivery networks directly.",
  },
  {
    question: "Where can I review specific claim procedures or coverage conditions?",
    answer:
      "To review specific terms, documentation requirements, or coverage conditions for your shipment before booking, please contact KSR directly via phone or WhatsApp.",
  },
  {
    question: "What should I send if my shipment is damaged?",
    answer:
      "If a shipment arrives damaged, please send a few photos and a short video that clearly show the shipping label, the AWB number, and the damaged parts. Please call or WhatsApp us on +91 99638 14267 to start the process.",
  },
];

export default function ShipmentInsurancePage() {
  const cleanWhatsApp = business.whatsapp.replace(/\D/g, "");
  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] pb-20 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: "Shipment Insurance", path: "/services/shipment-insurance" },
          ]}
        />

        {/* Hero */}
        <div className="my-10 lg:my-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Transit Protection Overview</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
            Shipment <span className="text-orange-500">Insurance Coverage</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
            Clear, transparent protection for your domestic and international courier consignments. 
            Established in Begumpet, Hyderabad in 2003, KSR Shipping Services books through reputable courier partners to protect your parcels throughout their journey.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
            >
              Contact KSR
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/get-quotation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold transition-all text-sm"
            >
              Get a Quote
            </Link>
          </div>
        </div>

        {/* Three-Tier Coverage Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm mb-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Three-Tier Insurance Structure</h2>
            <p className="text-sm text-gray-500">Transparent transit protection terms based on your shipment category</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Category</th>
                  <th className="py-4 px-4 sm:px-6">Coverage Tier</th>
                  <th className="py-4 px-4 sm:px-6">Key Conditions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {tiers.map((t, idx) => {
                  const Icon = t.icon;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-4 sm:px-6 font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span>{t.tier}</span>
                      </td>
                      <td className="py-5 px-4 sm:px-6">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                          {t.coverage}
                        </span>
                      </td>
                      <td className="py-5 px-4 sm:px-6 text-gray-600 leading-relaxed text-xs sm:text-sm">
                        {t.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* How It Works With KSR */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">How It Works with KSR Shipping Services</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            KSR acts as your dedicated booking and packing service. We collect your parcel from your doorstep, pack it in a standard carton with quality packing material, and book the consignment through established courier partner networks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm mb-3">1</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Doorstep Evaluation & Packing</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                We evaluate your items, provide a quotation, arrange free doorstep pickup in Hyderabad, and professionally pack your shipment.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm mb-3">2</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Partner Courier Booking</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Your parcel is brought to our Begumpet office and booked through established courier networks like DHL, FedEx, UPS, DTDC, or Delhivery.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm mb-3">3</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Doorstep Delivery</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                The partner courier network carries out delivery to your recipient&apos;s doorstep with tracking available through the courier partner.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-orange-50/70 border border-orange-100 text-xs sm:text-sm text-orange-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Please Note:</strong> KSR collects, packs, and books shipments through partner networks and does not operate delivery networks directly. For specific terms, documentation rules, or claim conditions before booking, please consult our team.
            </p>
          </div>
        </div>

        {/* If a Shipment Arrives Damaged */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">If a Shipment Arrives Damaged</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            If a shipment arrives damaged, please send a few photos and a short video that clearly show the shipping label, the AWB number, and the damaged parts.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Please call or WhatsApp us on {business.phone} to share the details and start the process with our team.
          </p>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm mb-12">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-2xl bg-gray-50/60 border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2">{faq.question}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 sm:p-10 text-white text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Questions About Shipment Insurance?</h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Contact KSR before booking to confirm insurance conditions, invoice requirements, or packaging guidelines for your destination.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shadow inline-flex items-center gap-2"
            >
              Contact Begumpet Office
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`https://wa.me/${cleanWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-orange-700/60 hover:bg-orange-700 text-white font-semibold transition-all text-sm border border-orange-400 inline-flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              WhatsApp: {business.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
