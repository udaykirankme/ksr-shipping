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
import { business } from "@/lib/config";

export default function AboutPage() {
  const highlights = [
    {
      icon: Globe2,
      title: "Worldwide Delivery Network",
      description: "Seamless international courier connectivity to over 150 countries, including USA, UK, Canada, Australia, UAE, and Europe.",
      href: "/services/international-courier",
    },
    {
      icon: Truck,
      title: "Pan-India Domestic Reach",
      description: "Air express and surface cargo options connecting all major Indian cities, industrial hubs, and tier 2/3 locations.",
      href: "/services/domestic-courier",
    },
    {
      icon: Package,
      title: "Food-Grade Packing",
      description: "Specialized packaging materials engineered for non-perishable homemade sweets, snacks, and pickles to reduce transit wear.",
      href: "/services/food-shipping",
    },
    {
      icon: ShieldCheck,
      title: "Prescription Medicine Handling",
      description: "Compliant healthcare logistics with dedicated guidance on prescriptions, chemist invoices, and customs paperwork.",
      href: "/services/medicine-shipping",
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
    <div className="bg-gray-50 min-h-screen pt-[74px] sm:pt-[82px] lg:pt-[92px] pb-16 sm:pb-20 relative overflow-hidden">
      {/* Background Ambience & Glows */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50/80 to-transparent pointer-events-none" />
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-80 sm:w-[500px] h-80 bg-gradient-to-tr from-orange-400/15 via-amber-300/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Hero Section */}
        <div className="text-center mt-3 sm:mt-5 lg:mt-7 mb-7 sm:mb-9 lg:mb-11 max-w-3xl mx-auto">
          {/* Hyderabad Specialist Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-orange-700 text-xs font-bold border border-orange-200/80 shadow-[0_2px_12px_rgba(249,115,22,0.08)] mb-3 sm:mb-4">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <Building2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span className="tracking-wide">Hyderabad Logistics & Courier Specialist</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-3 sm:mb-4 leading-[1.18]">
            About <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">KSR Shipping Services</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-4 sm:mb-5 px-1">
            Headquartered in Begumpet, Hyderabad, KSR Shipping Services provides comprehensive international courier, 
            pan-India domestic cargo, and specialized packaging solutions tailored for families, students, and businesses.
          </p>

          {/* Mobile & Desktop Quick Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 pb-1">
            {[
              { icon: Globe2, text: "150+ Countries" },
              { icon: Truck, text: "Free Doorstep Pickup" },
              { icon: Package, text: "Food-Grade Packing" },
              { icon: ShieldCheck, text: "Customs Support" },
            ].map((badge, i) => (
              <div 
                key={i} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-orange-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-[11px] sm:text-xs font-semibold text-gray-700 hover:border-orange-200 transition-colors"
              >
                <badge.icon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Core Narrative */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 shadow-[0_4px_24px_rgba(249,115,22,0.05)] hover:shadow-md border border-orange-100/70 transition-all duration-300 mb-10 sm:mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div>
              <div className="w-10 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-3" />
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
                Reliable Courier Services Grounded in Hyderabad
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed mb-3.5">
                At <strong>KSR Shipping Services</strong>, we bridge geographical boundaries by delivering packages safely to destinations across India and more than 150 countries worldwide. Whether sending traditional sweets to family abroad, dispatching urgent university admission documents, shipping eligible prescription medicines, or managing corporate shipments, we ensure each consignment receives careful attention.
              </p>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed mb-6">
                Through our strategic relationships with leading international and domestic carriers—including DHL, FedEx, UPS, DTDC, Delhivery, Shadowfax, and Ekart—we combine tier-one transit networks with personalized local support right from our Begumpet office.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  href="/get-quotation"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-300 hover:-translate-y-0.5 text-sm active:translate-y-0 w-full sm:w-auto"
                >
                  Request a Quote
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/track"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition-all hover:-translate-y-0.5 text-sm active:translate-y-0 w-full sm:w-auto border border-gray-200/60"
                >
                  Track Shipment
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50/80 via-orange-50/40 to-amber-50/30 rounded-2xl p-5 sm:p-8 border border-orange-100 mt-2 lg:mt-0">
              <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-3.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Operational Standards
              </h3>
              <ul className="space-y-2 sm:space-y-2.5">
                {operationalValues.map((value, i) => (
                  <li 
                    key={i} 
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 p-2 sm:p-2.5 rounded-xl bg-white/70 border border-orange-100/50 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all duration-200 hover:bg-white hover:translate-x-1 group"
                  >
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-125" />
                    <span className="group-hover:text-gray-900 transition-colors leading-relaxed">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="mb-10 sm:mb-14">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Our Core Services</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1.5 sm:mt-2">Engineered to meet specific personal and commercial shipping requirements</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {highlights.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="group relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-150 hover:border-orange-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(249,115,22,0.14)] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                {/* Accent Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                {/* Soft ambient background glow */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-orange-100/30 rounded-full blur-xl group-hover:bg-orange-200/50 transition-all duration-300 pointer-events-none" />

                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 shadow-sm group-hover:shadow-orange-500/25">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 transition-colors duration-200 group-hover:text-orange-600 flex items-center justify-between">
                    <span>{item.title}</span>
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">{item.description}</p>
                </div>

                <div className="flex items-center text-xs font-semibold text-orange-600 group-hover:text-orange-700 transition-colors pt-2 mt-auto border-t border-gray-50">
                  <span>Explore service</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform duration-300 group-hover:translate-x-1.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Business Office & Contact Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 text-sm">
            {/* Office Location */}
            <a 
              href={business.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3.5 p-4 rounded-2xl transition-all duration-300 hover:bg-orange-50/60 border border-transparent hover:border-orange-100 hover:shadow-sm group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 shadow-sm group-hover:shadow-orange-500/25">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-gray-900 block mb-1 group-hover:text-orange-600 transition-colors">Office Location</span>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  {business.address}, {business.locality}, {business.region} - {business.postalCode}
                </p>
                <span className="inline-flex items-center text-xs font-semibold text-orange-600 mt-2 gap-1 group-hover:underline">
                  View on Google Maps <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>

            {/* Phone & WhatsApp */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl transition-all duration-300 hover:bg-orange-50/60 border border-transparent hover:border-orange-100 hover:shadow-sm group">
              <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 shadow-sm group-hover:shadow-orange-500/25">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-gray-900 block mb-1.5 group-hover:text-orange-600 transition-colors">Phone & WhatsApp</span>
                <div className="space-y-1">
                  <a 
                    href={`tel:${business.phone.replace(/\s+/g, '')}`} 
                    className="text-gray-700 hover:text-orange-600 font-semibold text-sm transition-all flex items-center gap-1.5 hover:translate-x-1 duration-200"
                  >
                    <span>{business.phone}</span>
                  </a>
                  {business.phoneSecondary && (
                    <a 
                      href={`tel:${business.phoneSecondary.replace(/\s+/g, '')}`} 
                      className="text-gray-700 hover:text-orange-600 font-semibold text-sm transition-all flex items-center gap-1.5 hover:translate-x-1 duration-200"
                    >
                      <span>{business.phoneSecondary}</span>
                    </a>
                  )}
                </div>
                <span className="text-xs text-gray-500 block mt-2 font-medium">Complimentary Doorstep Pickup Available</span>
              </div>
            </div>

            {/* Email Support */}
            <a 
              href={`mailto:${business.email}`} 
              className="flex items-start gap-3.5 p-4 rounded-2xl transition-all duration-300 hover:bg-orange-50/60 border border-transparent hover:border-orange-100 hover:shadow-sm group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 shadow-sm group-hover:shadow-orange-500/25">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-gray-900 block mb-1 group-hover:text-orange-600 transition-colors">Email Support</span>
                <span className="text-gray-700 hover:text-orange-600 font-semibold text-xs sm:text-sm block break-all transition-colors">
                  {business.email}
                </span>
                <span className="text-xs text-gray-500 block mt-2 font-medium">Direct Inquiry & Quotations</span>
              </div>
            </a>

            {/* Operating Hours */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl transition-all duration-300 hover:bg-orange-50/60 border border-transparent hover:border-orange-100 hover:shadow-sm group">
              <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 shadow-sm group-hover:shadow-orange-500/25">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-gray-900 block mb-1 group-hover:text-orange-600 transition-colors">Operating Hours</span>
                <p className="text-gray-700 text-xs sm:text-sm font-medium">Monday - Saturday: 9:00 AM - 9:00 PM</p>
                <span className="text-xs text-gray-500 block mt-2 font-medium">Sunday by prior appointment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
