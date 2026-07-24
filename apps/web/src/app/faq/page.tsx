"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

const FAQS = [
  {
    question: "How do I track my shipment?",
    answer: "You can track your shipment using the tracking number provided at the time of booking. Simply enter the number in the tracking widget on our homepage or the Track Shipment page. You will see real-time status updates regardless of which courier partner is handling your delivery."
  },
  {
    question: "What are the restricted items for international shipping?",
    answer: "Restricted items generally include flammable liquids, explosives, corrosives, live animals, cash, and illegal substances. Different countries may have additional specific restrictions. Please check our Restricted Items page or contact support if you are unsure about a specific item."
  },
  {
    question: "How long does domestic delivery take?",
    answer: "Domestic delivery typically takes 1-2 business days for major metropolitan areas, and 3-5 business days for remote or regional locations. We also offer priority express services for urgent shipments."
  },
  {
    question: "Do you offer doorstep pickup?",
    answer: "Yes! We offer free doorstep pickup services for both domestic and international shipments. You can schedule a pickup online or by calling our customer support team."
  },
  {
    question: "What happens if I am not home to receive my package?",
    answer: "If you are unavailable, our courier partner will typically attempt delivery up to two more times on subsequent business days. Alternatively, they may leave a slip with instructions to collect the package from the nearest local facility."
  },
  {
    question: "How is the shipping cost calculated?",
    answer: "Shipping cost is calculated based on the greater of the actual weight or the volumetric weight (Length x Width x Height) of your parcel, as well as the destination and selected service speed."
  },
  {
    question: "Do you provide packaging materials?",
    answer: "We provide standard packaging materials like courier flyers and boxes for free. For specialized needs like fragile item packing or food-grade packing, we offer professional packaging services for a nominal fee to ensure the utmost safety."
  },
  {
    question: "Can I ship medicines internationally?",
    answer: "Yes, you can ship medicines internationally, but it requires a valid doctor's prescription, the original medical bill, and sometimes a letter of authorization. Please contact us beforehand so we can guide you through the required documentation."
  },
  {
    question: "Is there insurance for my shipments?",
    answer: "Basic liability coverage is included for all shipments. For high-value items, we strongly recommend purchasing additional transit insurance, which we can arrange at the time of booking for complete peace of mind."
  },
  {
    question: "What should I do if my shipment is delayed?",
    answer: "While we strive for 100% on-time delivery, delays can occasionally happen due to weather, customs clearance, or operational issues. If your shipment is delayed past the estimated delivery date, please reach out to our support team and we will prioritize resolving the issue."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] pb-24 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 mt-8">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
           >
             <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 text-orange-500 rounded-full mb-6">
                <MessageCircleQuestion className="w-8 h-8" />
             </div>
             <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">Frequently Asked Questions</h1>
             <p className="text-lg text-gray-600 leading-relaxed">
               Find answers to common questions about our shipping services, tracking, and policies.
             </p>
           </motion.div>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
           {FAQS.map((faq, i) => {
             const isOpen = openIndex === i;
             return (
               <motion.div
                 key={i}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.4, delay: i * 0.05 }}
                 className={`bg-white rounded-2xl border transition-colors duration-300 ${isOpen ? 'border-orange-200 shadow-md' : 'border-gray-100 shadow-sm hover:border-orange-100'}`}
               >
                 <button
                   onClick={() => toggleAccordion(i)}
                   className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                   aria-expanded={isOpen}
                 >
                   <span className={`text-lg font-bold transition-colors duration-300 ${isOpen ? 'text-orange-600' : 'text-gray-900'}`}>
                     {faq.question}
                   </span>
                   <motion.div
                     animate={{ rotate: isOpen ? 180 : 0 }}
                     transition={{ duration: 0.3, ease: "easeInOut" }}
                     className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-4 transition-colors duration-300 ${isOpen ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}
                   >
                     <ChevronDown className="w-5 h-5" />
                   </motion.div>
                 </button>

                 <AnimatePresence initial={false}>
                   {isOpen && (
                     <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: "auto", opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       transition={{ duration: 0.3, ease: "easeInOut" }}
                       className="overflow-hidden"
                     >
                       <div className="p-6 pt-0 text-gray-600 leading-relaxed">
                         {faq.answer}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </motion.div>
             );
           })}
        </div>

        {/* Footer Note */}
        <motion.div 
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, delay: 0.3 }}
           className="mt-16 bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm"
        >
           <h4 className="text-lg font-bold text-gray-900 mb-2">Still have questions?</h4>
           <p className="text-gray-600 mb-6">Our customer support team is always ready to assist you with any specific queries you might have.</p>
           <Link href="/contact" className="inline-flex h-12 items-center justify-center px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-colors">
              Contact Support
           </Link>
        </motion.div>
      </div>
    </div>
  );
}
