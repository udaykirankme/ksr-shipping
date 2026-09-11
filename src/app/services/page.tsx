"use client";

import { useEffect } from "react";
import { Plane, Truck, Box, HeartPulse, Building2, CheckCircle2, ShieldCheck, MapPin, FileText, Info, ArrowRight, Package } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { InfiniteCarousel } from "@/components/ui/InfiniteCarousel";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  title: string;
  shortDesc: string;
  icon: any;
  image: string;
  overview: string;
  benefits: string[];
  features: string[];
  coverage: string;
  detailHref?: string;
  infoNote?: {
    title: string;
    description: string;
  };
};

const SERVICES: Service[] = [
  {
    id: "international-courier",
    title: "International Courier",
    shortDesc: "Fast and reliable global delivery across 150+ countries with complete customs clearance and tracking.",
    icon: Plane,
    image: "/international_courier.png",
    overview: "Seamless global shipping to over 150 countries. We handle all customs documentation, international routing, and clearance to ensure your package arrives without delays or unexpected fees.",
    benefits: ["Free Customs Clearance Assistance", "Door-to-door Real-time Tracking", "Express & Economy Delivery Options"],
    features: ["Supported Types: Documents, Parcels, Freight", "Delivery: 3-7 Business Days globally", "Free Doorstep Pickup Available"],
    coverage: "150+ Countries Worldwide",
    detailHref: "/services/international-courier",
  },
  {
    id: "domestic-courier",
    title: "Domestic Courier",
    shortDesc: "Express air and cost-effective road cargo solutions connecting every city and village across India.",
    icon: Truck,
    image: "/domestic_courier.png",
    overview: "Fast, reliable, and secure shipping across every state, city, and remote village in India. Choose between our Domestic Air Courier service for urgent deliveries or our Domestic Road Courier service for cost-effective transportation. We help you select the best option based on your shipment's urgency, destination, and budget.",
    benefits: ["✈️ Domestic Air Courier for urgent and time-sensitive shipments", "🚛 Domestic Road Courier for economical and bulk deliveries", "Smart route selection for the fastest and most efficient delivery"],
    features: ["Service Modes: Air Courier & Road Courier", "Delivery Time: Based on the selected shipping mode and destination", "Doorstep Pickup Available Across India"],
    coverage: "Pan India (29 States, 8 UTs)",
    detailHref: "/services/domestic-courier",
    infoNote: {
      title: "Choose Your Delivery Mode",
      description: "Select between Air Courier for speed or Road Courier for economical shipping based on your requirements."
    }
  },
  {
    id: "food-shipping",
    title: "Food & Homemade Sweets Shipping",
    shortDesc: "Food-grade protective packing for homemade sweets, snacks, and leak-proof pickle jars overseas.",
    icon: Package,
    image: "/bg.png",
    overview: "Specialized food-grade packaging designed to reduce transit damage and maintain hygiene for homemade sweets, snacks, pickles, and dry spices sent from Hyderabad to the USA, UK, Canada, Australia, and worldwide.",
    benefits: ["Specialized Food-grade Materials", "Leak-resistant Pickle Packaging", "Express Global Air Dispatch"],
    features: ["Supported: Sweets, Snacks, Pickles, Spices", "Transit: 3-5 Days to Major Destinations", "Free Doorstep Pickup in Hyderabad"],
    coverage: "150+ Countries Worldwide",
    detailHref: "/services/food-shipping",
  },
  {
    id: "medicine-shipping",
    title: "Medicine Shipping",
    shortDesc: "Strictly compliant healthcare logistics with temperature-aware handling for prescription medicines.",
    icon: HeartPulse,
    image: "/medicine_shipping.png",
    overview: "Temperature-controlled and priority handling for prescription medicines, medical samples, and health essentials. We ensure strict compliance with health regulations.",
    benefits: ["Temperature-aware Handling", "Priority Custom Clearance", "Confidential & Secure Packaging"],
    features: ["Supported Types: Prescription Drugs, OTC", "Delivery: Express Priority Routing", "Specialized Documentation Support"],
    coverage: "Global Medical Reach",
    detailHref: "/services/medicine-shipping",
  },
  {
    id: "fragile-shipping",
    title: "Fragile Shipping",
    shortDesc: "Reinforced protective packing and cushioned layers for delicate glassware, artwork, and electronics.",
    icon: Box,
    image: "/fragile_shipping.png",
    overview: "Specialized packing with premium bubble wrap, foam peanuts, and reinforced double-walled boxes to guarantee the safety of electronics, glassware, and artwork.",
    benefits: ["Premium Multi-layer Protection", "Special Handling Labels & Procedures", "Comprehensive Transit Insurance"],
    features: ["Supported Types: Glass, Electronics, Art", "Delivery: Extra-care Courier Network", "Professional Packing Service"],
    coverage: "Available on all routes",
    detailHref: "/services/fragile-shipping",
  },
  {
    id: "document-delivery",
    title: "Express Document Delivery",
    shortDesc: "Urgent and confidential door-to-door delivery for critical passports, legal contracts, and transcripts.",
    icon: FileText,
    image: "/express_document_delivery.png",
    overview: "Secure delivery of important documents with fast, reliable and trackable service. We ensure your critical paperwork reaches its destination safely and on time.",
    benefits: ["Priority Handling", "Confidential & Secure Packaging", "Real-time Tracking Updates"],
    features: ["Supported Types: Legal Documents, Contracts, Passports", "Delivery: 1-2 Business Days", "Signature Required Upon Delivery"],
    coverage: "Global Document Reach",
    detailHref: "/services/document-shipping",
  },
  {
    id: "commercial-shipping",
    title: "Commercial Shipping",
    shortDesc: "Scalable B2B logistics, pallet freight, regular bulk dispatches, and customized corporate pricing.",
    icon: Building2,
    image: "/commercial_shipping.png",
    overview: "B2B logistics tailored for scale. Bulk shipment solutions, warehouse pickups, regular dispatch scheduling, and discounted corporate rates.",
    benefits: ["Dedicated Account Manager", "Discounted Volume Pricing", "API Integration for Tracking"],
    features: ["Supported Types: Pallets, Bulk Cartons", "Delivery: Scheduled LTL / FTL", "Warehouse & Factory Pickups"],
    coverage: "Global B2B Network",
    detailHref: "/services/commercial-shipping",
  }
];

const PARTNERS = [
  { src: "/delhivery logo.jpg", alt: "Delhivery" },
  { src: "/dtdc logo.png", alt: "DTDC" },
  { src: "/shadowfax logo.png", alt: "Shadowfax" },
  { src: "/ekart logo.jpg", alt: "Ekart" },
  { src: "/fedex logo.jpg", alt: "FedEx" },
  { src: "/ups logo.png", alt: "UPS" },
  { src: "/dhl logo.jpg", alt: "DHL" },
];

export default function ServicesPage() {

  // Smooth scroll highlighting effect
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          // Add glow highlight class
          element.classList.add("bg-orange-50/40", "transition-colors", "duration-1000");
          setTimeout(() => {
            element.classList.remove("bg-orange-50/40");
          }, 2500);
        }
      }
    };
    
    // Run on mount in case user navigated directly to an anchor
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen pt-[74px] sm:pt-[82px] lg:pt-[92px] pb-24 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      {/* 1. Hero Section */}
      <section className="pt-2 pb-2 sm:pt-4 sm:pb-3 lg:pt-6 lg:pb-4 relative z-10 text-center">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6 }}
            >
               <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">Our <span className="text-orange-500">Services</span></h1>
               <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                 From important international documents to heavy domestic freight, we have a premium shipping solution tailored for you.
               </p>
            </motion.div>
         </div>
      </section>

      {/* 2. Service Navigation Cards */}
      <section className="pb-16 pt-2 lg:pt-3 relative z-10">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
               {SERVICES.map((service, i) => {
                 const isLast = i === SERVICES.length - 1;
                 return (
                   <Link 
                     href={`#${service.id}`} 
                     key={i}
                     className={cn(
                       "h-full bg-gradient-to-b from-white to-orange-50/30 p-6 rounded-2xl border border-orange-100 shadow-[0_4px_20px_rgba(249,115,22,0.05)] flex flex-col items-center text-center hover:shadow-[0_12px_32px_rgba(249,115,22,0.18)] hover:border-orange-300 hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden backdrop-blur-sm cursor-pointer",
                       isLast ? "sm:col-span-2 sm:max-w-md sm:mx-auto sm:w-full lg:col-span-1 lg:col-start-2 lg:max-w-none lg:mx-0" : ""
                     )}
                   >
                      {/* Top Animated Accent Bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-orange-500 transition-all duration-300 relative z-10 shadow-[0_0_15px_rgba(249,115,22,0.1)] group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] shrink-0">
                         <service.icon className="w-7 h-7 text-orange-500 group-hover:text-white transition-colors duration-300" />
                      </div>
                      
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors relative z-10 mb-2">{service.title}</h3>
                      
                      <p className="text-xs text-gray-500 leading-relaxed relative z-10 mb-5 max-w-xs">{service.shortDesc}</p>
                      
                      <div className="mt-auto relative z-10 inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold shadow-[0_4px_15px_rgba(249,115,22,0.2)] group-hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] group-hover:-translate-y-0.5 group-hover:scale-[1.03] transition-all duration-300">
                        Learn More <span className="group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                      </div>
                   </Link>
                 );
               })}
            </div>
         </div>
      </section>

      {/* 3. Individual Service Sections */}
      {SERVICES.map((service, index) => {
         const isEven = index % 2 === 0;
         return (
           <section 
             id={service.id} 
             key={service.id}
             className="py-24 scroll-mt-[104px] lg:scroll-mt-[130px] border-b border-gray-100 transition-colors duration-1000"
           >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center`}>
                    
                    {/* Image / Asset Placeholder */}
                    <motion.div 
                      initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6 }}
                      className="w-full lg:w-1/2"
                    >
                       <div className="w-full aspect-[4/3] bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-3xl border border-orange-200/50 flex flex-col items-center justify-center shadow-inner relative overflow-hidden group">
                          <Image src={service.image} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" sizes="(max-width: 1024px) 100vw, 50vw" />
                       </div>
                    </motion.div>
                    
                    {/* Content */}
                    <motion.div 
                      initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6 }}
                      className="w-full lg:w-1/2"
                    >
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-bold mb-6">
                          <MapPin className="w-4 h-4" />
                          {service.coverage}
                       </div>
                       <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">{service.title}</h2>
                       <p className="text-lg text-gray-600 mb-8 leading-relaxed">{service.overview}</p>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                          <div>
                             <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Key Benefits</h4>
                             <ul className="space-y-3">
                                {service.benefits.map((b, i) => (
                                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                    {b}
                                  </li>
                                ))}
                             </ul>
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-500" /> Features & Info</h4>
                             <ul className="space-y-3">
                                {service.features.map((f, i) => (
                                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                    {f}
                                  </li>
                                ))}
                             </ul>
                          </div>
                       </div>
                       
                       {service.infoNote && (
                          <div className="mb-8 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl flex gap-4 items-start shadow-sm">
                             <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                                <Info className="w-4 h-4" />
                             </div>
                             <div>
                                <h5 className="font-bold text-gray-900 text-sm mb-1">{service.infoNote.title}</h5>
                                <p className="text-sm text-gray-600 leading-relaxed">{service.infoNote.description}</p>
                             </div>
                          </div>
                       )}
                       
                        <div className="flex flex-wrap gap-4 items-center">
                           <Link href="/get-quotation" className="inline-flex h-14 items-center justify-center px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:-translate-y-1 hover:from-orange-600 hover:to-orange-700">
                              Get Quote
                           </Link>
                           {service.detailHref && (
                              <Link href={service.detailHref} className="inline-flex h-14 items-center justify-center px-6 border border-gray-300 hover:border-orange-500 text-gray-800 hover:text-orange-600 font-semibold rounded-full transition-all duration-200">
                                 Detailed Guide <ArrowRight className="w-4 h-4 ml-1.5" />
                              </Link>
                           )}
                        </div>
                    </motion.div>
                    
                 </div>
              </div>
           </section>
         );
      })}

      {/* 4. Partners Marquee */}
      <section className="py-20 relative z-10 overflow-hidden">
         <div className="text-center mb-10">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Our Global Network Partners</h3>
         </div>
         <div className="flex flex-col gap-6 relative group/container">
            <InfiniteCarousel speed={1}>
               <div className="flex items-center gap-16 px-8">
                  {PARTNERS.map((partner, i) => (
                     <div key={`s-partner-${i}`} className="w-32 h-16 relative transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] shrink-0">
                        <Image src={partner.src} alt={partner.alt} fill className="object-contain" sizes="128px" loading="lazy" />
                     </div>
                  ))}
               </div>
            </InfiniteCarousel>
         </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-transparent to-orange-50/50 border-t border-orange-100/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
           >
             <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Need a custom shipping solution?</h2>
             <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
               Contact our team to discuss your specific requirements. We&apos;re happy to tailor our services to meet your unique needs.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/get-quotation" className="w-full sm:w-auto h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:-translate-y-1">
                  Get Quote
                </Link>
             </div>
           </motion.div>
        </div>
      </section>

    </div>
  );
}
