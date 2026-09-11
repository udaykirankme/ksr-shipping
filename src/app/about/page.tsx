import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Globe2, 
  Truck, 
  Package, 
  FileText, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { business } from "@/lib/config";

export default function AboutPage() {
  const highlights = [
    {
      icon: Globe2,
      title: "Worldwide Delivery Network",
      description: "Seamless international courier connectivity to over 150 countries, including USA, UK, Canada, Australia, UAE, and Europe.",
    },
    {
      icon: Truck,
      title: "Pan-India Domestic Reach",
      description: "Air express and surface cargo options connecting all major Indian cities, industrial hubs, and tier 2/3 locations.",
    },
    {
      icon: Package,
      title: "Food-Grade Packing",
      description: "Specialized packaging materials engineered for non-perishable homemade sweets, snacks, and pickles to reduce transit wear.",
    },
    {
      icon: ShieldCheck,
      title: "Prescription Medicine Handling",
      description: "Compliant healthcare logistics with dedicated guidance on prescriptions, chemist invoices, and customs paperwork.",
    },
  ];

  const operationalValues = [
    "Complimentary doorstep pickup across Hyderabad and surrounding localities.",
    "Integrated tracking updates across global and domestic partner networks.",
    "Multi-layer protective packaging for delicate, glassware, and electronic cargo.",
    "Transparent customs documentation support for personal and commercial parcels.",
    "Responsive support via Phone, WhatsApp, and Email throughout transit.",
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "About Us", path: "/about" },
          ]}
        />

        {/* Hero Section */}
        <div className="text-center my-10 lg:my-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 text-orange-700 text-xs font-semibold mb-4">
            <Building2 className="w-3.5 h-3.5" />
            <span>Hyderabad Logistics & Courier Specialist</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-6">
            About <span className="text-orange-500">KSR Shipping Services</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Headquartered in Begumpet, Hyderabad, KSR Shipping Services provides comprehensive international courier, 
            pan-India domestic cargo, and specialized packaging solutions tailored for families, students, and businesses.
          </p>
        </div>

        {/* Core Narrative */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                Reliable Courier Services Grounded in Hyderabad
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                At <strong>KSR Shipping Services</strong>, we bridge geographical boundaries by delivering packages safely to destinations across India and more than 150 countries worldwide. Whether sending traditional sweets to family abroad, dispatching urgent university admission documents, shipping eligible prescription medicines, or managing corporate shipments, we ensure each consignment receives careful attention.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Through our strategic relationships with leading international and domestic carriers—including DHL, FedEx, UPS, DTDC, Delhivery, Shadowfax, and Ekart—we combine tier-one transit networks with personalized local support right from our Begumpet office.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/get-quotation"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all shadow-md hover:shadow-orange-200 hover:-translate-y-0.5 text-sm"
                >
                  Request a Quote
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/track"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition-all text-sm"
                >
                  Track Shipment
                </Link>
              </div>
            </div>

            <div className="bg-orange-50/60 rounded-2xl p-6 sm:p-8 border border-orange-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Operational Standards</h3>
              <ul className="space-y-3">
                {operationalValues.map((value, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="mb-14">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Our Core Services</h2>
            <p className="text-gray-500 text-sm mt-2">Engineered to meet specific personal and commercial shipping requirements</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-100/70 text-orange-600 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Business Office & Contact Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block mb-1">Office Location</span>
                <p className="text-gray-600 leading-relaxed">
                  {business.address}, {business.locality}, {business.region} - {business.postalCode}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block mb-1">Phone & WhatsApp</span>
                <a href={`tel:${business.phone}`} className="text-gray-600 hover:text-orange-600 block">
                  {business.phone}
                </a>
                <span className="text-xs text-gray-400 block mt-0.5">Complimentary Doorstep Pickup Available</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block mb-1">Email Support</span>
                <a href={`mailto:${business.email}`} className="text-gray-600 hover:text-orange-600 block">
                  {business.email}
                </a>
                <span className="text-xs text-gray-400 block mt-0.5">Direct Inquiry & Quotations</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block mb-1">Operating Hours</span>
                <p className="text-gray-600">Monday - Saturday: 9:00 AM - 9:00 PM</p>
                <span className="text-xs text-gray-400 block mt-0.5">Sunday by prior appointment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
