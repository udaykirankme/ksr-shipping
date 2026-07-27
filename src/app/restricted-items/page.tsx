"use client";

import { Flame, Bomb, FlaskConical, Skull, Radiation, Banknote, Bug, Ban, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const RESTRICTED_ITEMS = [
  {
    id: "flammable",
    icon: Flame,
    name: "Flammable Liquids",
    desc: "Paints, thinners, lighter fluid, and aerosols.",
    reason: "Significant fire hazard during transit, especially in aviation.",
  },
  {
    id: "explosives",
    icon: Bomb,
    name: "Explosives & Arms",
    desc: "Fireworks, ammunition, flares, and firearms.",
    reason: "Extreme safety risk to personnel and transport vehicles.",
  },
  {
    id: "corrosives",
    icon: FlaskConical,
    name: "Corrosive Substances",
    desc: "Acids, battery fluid, and mercury.",
    reason: "Can cause severe damage to other packages and aircraft structures.",
  },
  {
    id: "toxic",
    icon: Skull,
    name: "Toxic & Infectious",
    desc: "Pesticides, poisons, and biohazards.",
    reason: "Direct danger to handling staff and public health.",
  },
  {
    id: "radioactive",
    icon: Radiation,
    name: "Radioactive Materials",
    desc: "Medical isotopes and industrial gauges.",
    reason: "Strict specialized licensing and shielding required by law.",
  },
  {
    id: "currency",
    icon: Banknote,
    name: "Cash & Currency",
    desc: "Banknotes, coins, and negotiable bonds.",
    reason: "High risk of theft, strictly not insured by standard courier networks.",
  },
  {
    id: "animals",
    icon: Bug,
    name: "Live Animals",
    desc: "Pets, livestock, insects, and biological samples.",
    reason: "Requires specialized animal transport services and ventilation.",
  },
  {
    id: "illegal",
    icon: Ban,
    name: "Illegal Narcotics",
    desc: "Banned substances and unlicensed medicines.",
    reason: "Strict legal prohibition under domestic and international law.",
  },
];

export default function RestrictedItemsPage() {
  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] pb-24 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 mt-8">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
           >
             <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 text-red-500 rounded-full mb-6">
                <AlertTriangle className="w-8 h-8" />
             </div>
             <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">Restricted & Prohibited Items</h1>
             <p className="text-lg text-gray-600 leading-relaxed">
               For the safety of our staff and to comply with aviation and transport regulations, the following items are strictly prohibited from being shipped through our network.
             </p>
           </motion.div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {RESTRICTED_ITEMS.map((item, i) => (
             <motion.div
               key={item.id}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: i * 0.1 }}
               className="bg-white rounded-2xl p-6 border-l-4 border-orange-500 shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(249,115,22,0.15)] hover:-translate-y-1 transition-all duration-300 flex flex-col group"
             >
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                   <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">{item.desc}</p>
                
                <div className="pt-4 border-t border-gray-100 mt-auto">
                   <span className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-1">Reason for restriction:</span>
                   <p className="text-xs text-gray-500 leading-relaxed">{item.reason}</p>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Footer Note */}
        <motion.div 
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, delay: 0.5 }}
           className="mt-16 bg-white rounded-2xl p-8 text-center max-w-3xl mx-auto border border-gray-200 shadow-sm"
        >
           <h4 className="text-lg font-bold text-gray-900 mb-2">Not sure if your item is allowed?</h4>
           <p className="text-gray-600 mb-6">If you have any doubts about a specific item, please contact our support team before booking a shipment to avoid confiscation or fines.</p>
           <a href="/contact" className="inline-flex h-12 items-center justify-center px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-colors">
              Contact Support
           </a>
        </motion.div>
      </div>
    </div>
  );
}
