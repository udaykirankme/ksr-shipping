"use client";

import { MessageSquare, AlertTriangle, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SupportPage() {
  const cards = [
    {
      title: "Contact Support",
      desc: "Need assistance with your shipment, quotation, or any other enquiry? Our support team is here to help.",
      icon: MessageSquare,
      buttonText: "Contact Us",
      href: "/contact"
    },
    {
      title: "Restricted Items",
      desc: "View the list of prohibited and restricted items before booking your shipment.",
      icon: AlertTriangle,
      buttonText: "View Restricted Items",
      href: "/restricted-items"
    },
    {
      title: "Frequently Asked Questions",
      desc: "Find answers to common questions about booking, tracking, pricing, delivery timelines, and shipping services.",
      icon: HelpCircle,
      buttonText: "Browse FAQs",
      href: "/faq"
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      {/* Hero */}
      <section className="py-24 relative z-10 text-center">
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
               <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">Support <span className="text-orange-500">Center</span></h1>
               <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                 Find answers, review our shipping guidelines, or get in touch with our dedicated support team.
               </p>
            </motion.div>
         </div>
      </section>

      {/* Support Cards */}
      <section className="py-24 relative z-10">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
               {cards.map((card, idx) => (
                  <motion.div
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true, margin: "-50px" }}
                     transition={{ duration: 0.5, delay: idx * 0.1 }}
                     key={idx}
                     className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_15px_40px_-15px_rgba(249,115,22,0.25)] hover:border-orange-200 animate-glow group"
                  >
                     <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-6 text-orange-500 transition-colors duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                        <card.icon className="w-7 h-7" />
                     </div>
                     <h3 className="text-xl font-black text-gray-900 mb-4">{card.title}</h3>
                     <p className="text-base text-gray-600 leading-relaxed mb-8 flex-grow">
                        {card.desc}
                     </p>
                     <Link 
                        href={card.href}
                        className="w-full inline-flex h-12 items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:-translate-y-1 hover:from-orange-600 hover:to-orange-700"
                     >
                        {card.buttonText}
                     </Link>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}
