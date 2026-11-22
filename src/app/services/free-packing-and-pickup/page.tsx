import Link from "next/link";
import { 
  Package, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Phone,
  Sparkles,
  Layers,
  Box
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { business } from "@/lib/config";

const processSteps = [
  {
    step: "1",
    title: "Customer Contact & Inquiry",
    desc: "The customer contacts KSR Shipping Services with domestic or international courier shipping requirements.",
  },
  {
    step: "2",
    title: "Shipment Evaluation & Quotation",
    desc: "Our team evaluates the shipment details and provides a clear, upfront quotation based on destination and package size.",
  },
  {
    step: "3",
    title: "Customer Approval",
    desc: "The customer reviews and approves the quotation and confirms a preferred doorstep pickup schedule.",
  },
  {
    step: "4",
    title: "Doorstep Collection & Expert Packing",
    desc: "We arrange doorstep collection and expertly pack the items in a standard carton using quality packing material.",
  },
  {
    step: "5",
    title: "Office Intake",
    desc: "The packed shipment is brought to our Begumpet office, ready for courier booking.",
  },
  {
    step: "6",
    title: "Established Courier Partner Booking",
    desc: "We book the consignment through an appropriate established courier partner (including DHL, FedEx, UPS, DTDC, or Delhivery).",
  },
  {
    step: "7",
    title: "Recipient Doorstep Delivery",
    desc: "The courier partner transports the consignment and delivers it directly to the recipient's doorstep with tracking.",
  },
];

const faqs = [
  {
    question: "Is doorstep pickup really free across Hyderabad?",
    answer:
      "Yes. KSR Shipping Services provides 100% free doorstep collection from your home or office across Hyderabad. There are no extra pickup fees.",
  },
  {
    question: "Are packaging materials and packing services free of charge?",
    answer:
      "Yes. Professional packaging—including standard corrugated cartons, multilayer food-grade packing for sweets and pickles, and cushioning for fragile goods—is completely free with our doorstep pickup service.",
  },
  {
    question: "How are liquids, pickles, and food items packed to prevent leakage?",
    answer:
      "Liquids, pickles, and food items receive specialized multilayer packaging engineered to prevent leakage, oil seepage, and staining during international and domestic transit.",
  },
  {
    question: "What packing is provided for fragile items?",
    answer:
      "Fragile and delicate items are packed using quality protective cushioning, shock-absorbing bubble wrap, and sturdy corrugated cartons to protect them against transit vibration.",
  },
  {
    question: "Does KSR Shipping Services operate the delivery transportation fleets directly?",
    answer:
      "No. KSR Shipping Services collects, expertly packs, and books shipments through established courier partner networks (including DHL, FedEx, UPS, DTDC, and Delhivery); we do not operate delivery networks directly.",
  },
  {
    question: "Can I ship from outside Hyderabad?",
    answer:
      "Domestic shipments can also be booked from other states. International shipments are available from Hyderabad only. Contact our team to arrange your shipment.",
  },
];

export default function FreePackingAndPickupPage() {
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
            { name: "Free Packing & Pickup", path: "/services/free-packing-and-pickup" },
          ]}
        />

        {/* Hero */}
        <div className="my-10 lg:my-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complimentary Customer Care</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
            Free Packing & <span className="text-orange-500">Doorstep Pickup</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
            Sending parcels across India or worldwide should be seamless. Established in 2003 in Begumpet, Hyderabad, 
            KSR Shipping Services offers complimentary doorstep pickup and expert packaging in standard cartons using quality packing materials.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
            >
              Book Free Pickup
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold transition-all text-sm"
            >
              Contact Begumpet Office
            </Link>
          </div>
        </div>

        {/* What Is Free Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm mb-12">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">What Is 100% Free?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              At KSR Shipping Services, we believe quality packaging and convenient pickup should be accessible to all customers without hidden add-on fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Free Doorstep Pickup</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  We collect your parcels directly from your residence or business in Hyderabad at no additional charge. There are no convenience fees or pickup surcharges.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Free Professional Packing</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  We provide standard cartons, multilayer food-grade packaging for sweets and pickles, and shock cushioning for fragile items free of charge.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 7-Step Process */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm mb-12">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Our 7-Step Courier Process</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              How your package moves safely from your doorstep in Hyderabad to its final delivery destination:
            </p>
          </div>

          <div className="space-y-4">
            {processSteps.map((step, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-orange-50/70 border border-orange-100 text-xs sm:text-sm text-orange-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Partner Network Fulfillment:</strong> KSR Shipping Services collects, professionally packs, and books shipments through established courier partners (such as DHL, FedEx, UPS, DTDC, and Delhivery). We do not operate delivery aircraft or ground transport fleets directly.
            </p>
          </div>
        </div>

        {/* Specialized Packing Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Multilayer Packing for Food & Pickles */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
                Multilayer Packing for Liquids, Pickles & Food
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                Shipping homemade sweets, savories, and traditional pickles overseas requires specialized care. We apply multilayer packing designed to prevent leakage, oil seepage, and staining during international flight and road transit.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Food-grade protective materials for hygiene</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Tight leak-resistant wraps for pickle jars and liquids</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Reinforced outer cartons to prevent crushing</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Fragile-Item Packaging */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6">
                <Box className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
                Protective Packaging for Fragile Items
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                Delicate goods, glassware, precision electronics, and handicrafts require resilient cushioning. We use shock-absorbent bubble wrap, corner guards, and heavy-duty corrugated cartons to keep fragile items secure.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Shock-absorbing multi-layer bubble wrap</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Edge and corner protection for electronics & glass</span>
                </li>
              </ul>
            </div>
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
              <div key={i} className="p-5 rounded-2xl bg-gray-50/60 border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2">{faq.question}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 sm:p-10 text-white text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Schedule Your Free Doorstep Pickup</h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Call or WhatsApp our Begumpet office. We evaluate your shipment, provide a transparent quote, and pack your items with quality materials right at your doorstep.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shadow inline-flex items-center gap-2"
            >
              Get Free Quote
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
