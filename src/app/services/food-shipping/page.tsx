import Link from "next/link";
import { 
  Package, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function FoodShippingPage() {
  const categories = [
    {
      title: "Homemade Sweets",
      examples: "Laddu, Mysore Pak, Kaju Katli, Halwa, Sunnundalu, Ariselu, Dry Fruit Sweets.",
      note: "Packed with food-grade butter paper, vacuum trays, and outer moisture seals.",
    },
    {
      title: "Traditional Pickles",
      examples: "Mango (Avakaya), Lime, Gongura, Tomato, and seasonal veg/non-veg pickles.",
      note: "Multi-layer leak-resistant containers with tight seals to prevent oil seepage in transit.",
    },
    {
      title: "Savory Snacks & Mixtures",
      examples: "Murukku, Chegodilu, Mixture, Ribbon Pakoda, Banana Chips, Nippattu.",
      note: "Cushioned in air-sealed food-grade bags to minimize crumbling.",
    },
    {
      title: "Spices & Podis",
      examples: "Kandi podi, Karampodi, Idli podi, Biryani masala, Turmeric, Sambar powder.",
      note: "Heat-sealed puncture-proof foil packaging for aroma and freshness retention.",
    },
  ];

  const packingSteps = [
    { step: "1", title: "Inspection & Weighing", desc: "Item check at doorstep or Begumpet facility to ensure items meet destination customs guidelines." },
    { step: "2", title: "Food-Grade Enclosure", desc: "Food items are placed into certified food-safe containers and vacuum-sealed pouches." },
    { step: "3", title: "Cushioning & Corrugation", desc: "Containers are surrounded with shock-absorbing foam or bubble wrap within sturdy outer boxes." },
    { step: "4", title: "Air Dispatch & Tracking", desc: "Expedited via global air cargo with comprehensive milestone tracking until destination delivery." },
  ];

  const faqs = [
    {
      q: "Can I send homemade pickles internationally from Hyderabad?",
      a: "Yes, non-perishable pickles can be shipped. We apply specialized food-grade, leak-resistant multi-layered packaging engineered to reduce transit damage and prevent oil leaks.",
    },
    {
      q: "What food items are not permitted for international shipping?",
      a: "Perishable items that spoil without active refrigeration, raw agricultural produce, raw meat, unsealed liquid dairy, and items prohibited by the destination country cannot be shipped.",
    },
    {
      q: "Which countries can I ship homemade sweets to?",
      a: "We ship to major destinations worldwide including USA, UK, Canada, Australia, UAE, Singapore, Malaysia, and European countries.",
    },
    {
      q: "Do I need to bring my food parcels to your Begumpet office?",
      a: "No, we provide complimentary doorstep pickup across Hyderabad. Our team can collect and assist with professional packaging right from your home or office.",
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
            { name: "Food Shipping", path: "/services/food-shipping" },
          ]}
        />

        {/* Hero */}
        <div className="my-10 lg:my-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Specialized Food-Grade Packaging</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
            Food & Homemade Sweets <span className="text-orange-500">Courier from Hyderabad</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
            Share the authentic taste of home with family and loved ones abroad. We provide specialized food-grade materials, 
            leak-resistant pickle sealing, and express international air delivery to the USA, UK, Canada, Australia, and 150+ countries.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
            >
              Get Food Shipping Quote
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

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.title}</h3>
              <p className="text-xs text-gray-500 mb-4"><strong className="text-gray-800">Popular items:</strong> {cat.examples}</p>
              <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-100 text-xs text-orange-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>{cat.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 4-Step Packaging Process */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Our Food Packaging Process</h2>
          <p className="text-sm text-gray-500 mb-8">Designed to reduce transit wear and preserve culinary hygiene</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {packingSteps.map((step, i) => (
              <div key={i} className="relative">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-3 text-sm">
                  {step.step}
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Send Sweets & Pickles Worldwide</h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-6">
            Schedule a free doorstep pickup in Hyderabad. We apply specialized food-grade packaging to protect your homemade delicacies.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/get-quotation"
              className="px-6 py-3 rounded-full bg-white text-orange-600 font-bold hover:bg-orange-50 transition-all text-sm shadow"
            >
              Get Food Shipping Rates
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
