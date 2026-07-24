"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { 
  PackageCheck, Home, MapPin, Globe2, Network, ShieldCheck, 
  HeadphonesIcon, ThumbsUp, Box, HeartPulse, Building2, Zap 
} from "lucide-react";

import { InfiniteCarousel } from "@/components/ui/InfiniteCarousel";

// Top Row
const ROW_ONE = [
  { icon: PackageCheck, title: "Premium Food-Grade Packing", desc: "We use premium food-grade packing materials to keep your parcels clean, safe and protected." },
  { icon: Home, title: "Convenient Doorstep Pickup", desc: "Schedule a pickup from your home or office without visiting a courier branch." },
  { icon: MapPin, title: "Real-Time Shipment Tracking", desc: "Track your shipment in real time using a single tracking number for all partners." },
  { icon: Globe2, title: "Global Shipping", desc: "Reliable courier services across India and worldwide through trusted partners." },
  { icon: Box, title: "Fragile Shipments", desc: "Extra cushioning and careful handling for your fragile and valuable items." },
  { icon: HeartPulse, title: "Secure Medicine Shipping", desc: "Safe transportation with temperature-aware handling where required." },
  { icon: Building2, title: "Business Logistics Solutions", desc: "Smart logistics, bulk shipments, and B2B solutions for your business." },
];

// Bottom Row
const ROW_TWO = [
  { icon: ShieldCheck, title: "Safe & Secure", desc: "Your shipments are always in safe hands with our industry-best security." },
  { icon: Zap, title: "Priority Express Delivery", desc: "On-time delivery across India & worldwide with priority routing." },
  { icon: HeadphonesIcon, title: "Dedicated Customer Support", desc: "Quick responses via Phone, WhatsApp and Email whenever you need assistance." },
  { icon: Network, title: "Trusted Courier Network", desc: "We intelligently work with leading courier companies for the best experience." },
  { icon: ShieldCheck, title: "Advanced Secure Packaging", desc: "Fragile and sensitive shipments are packed carefully using best practices." },
  { icon: ThumbsUp, title: "Trusted by Thousands", desc: "Thousands of happy customers trust KSR Shipping Services every day." },
];

export function WhyChooseCarousel() {
  const shouldReduceMotion = useReducedMotion();

  const Card = ({ item }: { item: { icon: React.ElementType; title: string; desc: string; } }) => (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        boxShadow: "0 10px 30px -10px rgba(249, 115, 22, 0.15)", // Mobile glow
      }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-[280px] sm:w-[320px] h-[190px] shrink-0 bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-gray-100 flex flex-col items-start transition-all duration-300 ease-in-out lg:hover:-translate-y-2 lg:hover:scale-[1.03] lg:hover:shadow-[0_15px_40px_-15px_rgba(249,115,22,0.25)] lg:hover:border-orange-200 animate-glow group"
    >
      <div className="w-12 h-12 shrink-0 bg-orange-50 rounded-xl flex items-center justify-center mb-4 text-orange-500 transition-colors duration-300 lg:group-hover:bg-orange-500 lg:group-hover:text-white lg:group-hover:shadow-[0_0_15px_rgba(249,115,22,0.5)]">
        <item.icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">{item.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{item.desc}</p>
    </motion.div>
  );

  return (
    <section className="py-20 relative overflow-hidden bg-white z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
           <motion.div 
             initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="flex items-center justify-center gap-4"
           >
             <div className="h-[2px] w-8 sm:w-12 bg-orange-200"></div>
             <h2 className="text-sm sm:text-base font-bold text-orange-500 tracking-widest uppercase">
               Why Choose KSR
             </h2>
             <div className="h-[2px] w-8 sm:w-12 bg-orange-200"></div>
           </motion.div>
           <h3 className="mt-4 text-3xl md:text-4xl font-black text-gray-900">Premium Shipping Experience</h3>
        </div>
      </div>

      <div className="flex flex-col gap-6 relative group/container">
        {/* Top Row - Scroll Left */}
        <InfiniteCarousel speed={1}>
          <div className="flex gap-6 pr-6">
            {ROW_ONE.map((card, idx) => <Card key={`row1-${idx}`} item={card} />)}
          </div>
        </InfiniteCarousel>

        {/* Bottom Row - Scroll Right */}
        <InfiniteCarousel speed={-1}>
          <div className="flex gap-6 pr-6">
            {ROW_TWO.map((card, idx) => <Card key={`row2-${idx}`} item={card} />)}
          </div>
        </InfiniteCarousel>
      </div>
    </section>
  );
}
