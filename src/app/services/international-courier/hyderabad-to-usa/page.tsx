import Link from "next/link";
import { 
  Plane, 
  Clock, 
  ShieldCheck, 
  Package, 
  FileText, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function HyderabadToUsaPage() {
  const commonItems = [
    {
      title: "Homemade Food & Sweets",
      desc: "Traditional Telangana & Andhra sweets, savory snacks (murukku, mixture), and dry spices packed in specialized food-grade materials.",
    },
    {
      title: "Handmade Pickles",
      desc: "Carefully sealed, multi-layer leak-resistant packaging designed to endure long-haul international flights.",
    },
    {
      title: "University & Legal Documents",
      desc: "Express delivery for I-20 documentation, transcripts, university applications, and legal affidavits with signature confirmation.",
    },
    {
      title: "Prescription Medicines",
      desc: "Urgent medicine shipments for parents or relatives with registered physician prescriptions and verified chemist bills.",
    },
    {
      title: "Ethnic Wear & Textiles",
      desc: "Sarees, kurtas, wedding attire, and fabrics shipped securely with moisture-resistant protective wraps.",
    },
  ];

  const faqs = [
    {
      q: "How many days does a courier take from Hyderabad to the USA?",
      a: "Transit typically takes 3 to 5 business days for Express delivery and 5 to 8 business days for Economy services, subject to US customs processing times.",
    },
    {
      q: "Can I send homemade mango or lemon pickles to the USA?",
      a: "Yes, non-perishable pickles can be shipped. We apply specialized food-grade, leak-resistant packaging to help safeguard against transit damage and maintain hygiene throughout air transit.",
    },
    {
      q: "Do you offer doorstep parcel collection in Hyderabad for USA shipments?",
      a: "Yes, KSR Shipping Services provides complimentary doorstep pickup anywhere in Hyderabad, including Begumpet, Banjara Hills, Jubilee Hills, Madhapur, Gachibowli, Kukatpally, Secunderabad, and surrounding areas.",
    },
    {
      q: "What documents are required to send a parcel to the USA?",
      a: "You will need the sender's government ID (such as Aadhaar or Passport copy), complete recipient address with US ZIP code and phone number, and a detailed itemized packing declaration.",
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
            { name: "Hyderabad to USA", path: "/services/international-courier/hyderabad-to-usa" },
          ]}
        />

        {/* Hero */}
        <div className="my-10 lg:my-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-4">
            <Plane className="w-3.5 h-3.5" />
            <span>Dedicated Air Route: Hyderabad (HYD) to United States (USA)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4">
            International Courier from <span className="text-orange-500">Hyderabad to USA</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl">
            Send parcels, homemade sweets, pickles, university documents, and prescription medicines to any US state. 
            Enjoy complimentary doorstep pickup across Greater Hyderabad, food-grade packing, and door-to-door tracking.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/get-quotation"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md hover:shadow-orange-200 transition-all text-sm"
            >
              Get USA Courier Rate
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold transition-all text-sm"
            >
              Track Package
            </Link>
          </div>
        </div>

        {/* Delivery Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <Clock className="w-6 h-6 text-orange-500 mb-2" />
            <span className="font-bold text-gray-900 block text-sm">Estimated Transit</span>
            <p className="text-xs text-gray-500 mt-1">Express: 3-5 business days<br />Economy: 5-8 business days</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <Package className="w-6 h-6 text-orange-500 mb-2" />
            <span className="font-bold text-gray-900 block text-sm">Food-Grade Packaging</span>
            <p className="text-xs text-gray-500 mt-1">Multi-layer seal for homemade sweets, snacks, and non-perishable pickles.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <MapPin className="w-6 h-6 text-orange-500 mb-2" />
            <span className="font-bold text-gray-900 block text-sm">Hyderabad Free Pickup</span>
            <p className="text-xs text-gray-500 mt-1">Zero-fee doorstep collection from home or office across the city.</p>
          </div>
        </div>

        {/* Common Categories */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Popular Items Shipped to the USA</h2>
          <p className="text-sm text-gray-500 mb-6">Designed to help students, families, and professionals stay connected with home</p>
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
            <h3 className="text-xl font-bold">Shipping a Parcel from Hyderabad to USA?</h3>
            <p className="text-xs sm:text-sm text-orange-100 mt-1">Schedule your pickup or consult our team on packaging requirements.</p>
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
