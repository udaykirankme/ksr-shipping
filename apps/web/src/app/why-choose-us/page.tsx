"use client";

import { business } from "@ksr/config";
import { ShieldCheck, Target, Users, Zap, Clock, ThumbsUp, PackageCheck, Home, MapPin, Globe2, Box, HeartPulse, Building2, HeadphonesIcon, Network } from "lucide-react";
import { useRef, useEffect } from "react";
import { useInView, animate, motion } from "framer-motion";
import Link from "next/link";

function AnimatedCounter({ from, to, suffix = "", duration = 2 }: { from: number, to: number, suffix?: string, duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  useEffect(() => {
    if (inView) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          if (ref.current) {
            const formatted = value >= 1000 ? Math.round(value).toLocaleString() : Math.round(value);
            ref.current.textContent = `${formatted}${suffix}`;
          }
        }
      });
      return () => controls.stop();
    }
  }, [from, to, inView, duration, suffix]);
  return <span ref={ref}>{from}{suffix}</span>;
}

export default function WhyChooseUsPage() {
  const reasons = [
    { icon: PackageCheck, title: "Premium Food-Grade Packing", desc: "We use premium food-grade packing materials to keep your parcels clean, safe and protected." },
    { icon: Home, title: "Convenient Doorstep Pickup", desc: "Schedule a pickup from your home or office without visiting a courier branch." },
    { icon: MapPin, title: "Real-Time Shipment Tracking", desc: "Track your shipment in real time using a single tracking number for all partners." },
    { icon: Globe2, title: "Global Shipping", desc: "Reliable courier services across India and worldwide through trusted partners." },
    { icon: Box, title: "Fragile Shipments", desc: "Extra cushioning and careful handling for your fragile and valuable items." },
    { icon: HeartPulse, title: "Secure Medicine Shipping", desc: "Safe transportation with temperature-aware handling where required." },
    { icon: Building2, title: "Business Logistics Solutions", desc: "Smart logistics, bulk shipments, and B2B solutions for your business." },
    { icon: Zap, title: "Priority Express Delivery", desc: "On-time delivery across India & worldwide with priority routing." },
    { icon: HeadphonesIcon, title: "Dedicated Customer Support", desc: "Quick responses via Phone, WhatsApp and Email whenever you need assistance." },
    { icon: Network, title: "Trusted Courier Network", desc: "We intelligently work with leading courier companies for the best experience." },
    { icon: ShieldCheck, title: "Advanced Secure Packaging", desc: "Fragile and sensitive shipments are packed carefully using best practices." },
    { icon: ThumbsUp, title: "Trusted by Thousands", desc: "Thousands of happy customers trust KSR Shipping Services every day." },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      {/* Hero */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">Why Choose <span className="text-orange-600">KSR Shipping?</span></h1>
           <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
             We don&apos;t just deliver packages; we deliver promises. Discover what makes us the preferred shipping partner for thousands.
           </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reasons.map((reason, idx) => (
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.05 }}
                  key={idx} 
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_15px_40px_-15px_rgba(249,115,22,0.25)] hover:border-orange-200 animate-glow group"
               >
                  <div className="w-12 h-12 shrink-0 bg-orange-50 rounded-xl flex items-center justify-center mb-4 text-orange-500 transition-colors duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                     <reason.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">{reason.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{reason.desc}</p>
               </motion.div>
            ))}
         </div>
      </div>

      {/* Stats CTA */}
      <div className="bg-gray-900 text-white py-20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-12">Numbers That Speak For Themselves</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 divide-x divide-gray-800">
               <div className="flex flex-col items-center">
                  <div className="text-4xl md:text-5xl font-black text-orange-500 mb-2">
                    <AnimatedCounter from={0} to={15} suffix="+" duration={1.5} />
                  </div>
                  <div className="text-gray-400 font-medium">Years Experience</div>
               </div>
               <div className="flex flex-col items-center">
                  <div className="text-4xl md:text-5xl font-black text-orange-500 mb-2">
                    <AnimatedCounter from={0} to={50} suffix="K+" duration={2} />
                  </div>
                  <div className="text-gray-400 font-medium">Happy Customers</div>
               </div>
               <div className="flex flex-col items-center">
                  <div className="text-4xl md:text-5xl font-black text-orange-500 mb-2">
                    <AnimatedCounter from={0} to={150} suffix="+" duration={2.5} />
                  </div>
                  <div className="text-gray-400 font-medium">Countries Covered</div>
               </div>
               <div className="flex flex-col items-center">
                  <div className="text-4xl md:text-5xl font-black text-orange-500 mb-2">
                    <AnimatedCounter from={0} to={99} suffix=".5%" duration={2} />
                  </div>
                  <div className="text-gray-400 font-medium">On-Time Delivery</div>
               </div>
            </div>
            
            <Link href="/get-quotation" className="inline-flex h-14 items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:scale-105 active:scale-95">
               Experience the Difference Today
            </Link>
         </div>
      </div>
    </div>
  );
}
